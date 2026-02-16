<?php

namespace App\Service;

use App\Entity\SampleMatch;
use App\Entity\SampleMatchParticipant;
use App\Repository\SampleMatchParticipantRepository;
use App\Repository\SampleMatchRepository;
use App\Repository\SamplePlayerRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Persists full Match-v5 payload into sample_match and sample_match_participant.
 * When $fetchTierRankForAllParticipants is true, persists all 10 participants and
 * fetches tier/rank by puuid (with cache and throttling) for participants other than the seed.
 */
class SampleMatchStorageService
{
    private const POSITION_MAP = [
        'TOP' => 'TOP',
        'JUNGLE' => 'JUNGLE',
        'MIDDLE' => 'MID',
        'MID' => 'MID',
        'BOTTOM' => 'BOTTOM',
        'ADC' => 'BOTTOM',
        'UTILITY' => 'UTILITY',
        'SUPPORT' => 'UTILITY',
    ];

    private const QUEUE_ID_TO_QUEUE_TYPE = [
        420 => 'RANKED_SOLO_5x5',
        440 => 'RANKED_FLEX_SR',
    ];

    private const DEFAULT_RETRY_AFTER_SECONDS = 130;

    /** @var array<string, array{0: ?string, 1: ?string}> in-memory cache region:puuid => [tier, rank] */
    private array $tierRankCache = [];

    public function __construct(
        private readonly SampleMatchRepository $sampleMatchRepository,
        private readonly SampleMatchParticipantRepository $sampleMatchParticipantRepository,
        private readonly EntityManagerInterface $em,
        private readonly RiotApiService $riotApi,
        private readonly RiotApiThrottler $throttler,
        private readonly SamplePlayerRepository $samplePlayerRepository,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * Persist full match payload: sample_match + all 10 participants in sample_match_participant.
     * Seed participant uses $tier/$rank when provided. When $fetchTierRankForAllParticipants is true,
     * other participants get tier/rank from SamplePlayer cache or from League-v4 by puuid (throttled).
     *
     * @param string $puuid The "seed" puuid (player we were scraping); used for tier/rank when not fetching for all
     * @param bool   $fetchTierRankForAllParticipants When true, fetch tier/rank for non-seed participants (scraper use)
     * @param string|null $platform Platform for API calls (e.g. br1). If null, derived from $region (lowercase).
     */
    public function persistMatchPayload(
        array $matchPayload,
        string $region,
        string $puuid,
        ?string $tier = null,
        ?string $rank = null,
        bool $fetchTierRankForAllParticipants = false,
        ?string $platform = null,
    ): void {
        $matchId = $matchPayload['metadata']['matchId'] ?? $matchPayload['info']['gameId'] ?? null;
        if (!$matchId) {
            return;
        }
        $matchId = (string) $matchId;
        $info = $matchPayload['info'] ?? [];
        $participants = $info['participants'] ?? [];
        $gameDuration = (int) ($info['gameDuration'] ?? 0);
        $gameDurationMinutes = $gameDuration > 0 ? $gameDuration / 60.0 : 1.0;
        $queueId = isset($info['queueId']) ? (int) $info['queueId'] : null;
        $gameCreation = isset($info['gameCreation']) ? (string) $info['gameCreation'] : null;
        $platform = $platform !== null && $platform !== '' ? $platform : strtolower($region);

        $sampleMatch = $this->sampleMatchRepository->findByMatchIdAndRegion($matchId, $region);
        if (!$sampleMatch) {
            $sampleMatch = new SampleMatch();
            $sampleMatch->setMatchId($matchId);
            $sampleMatch->setRegion($region);
            $sampleMatch->setPayload($matchPayload);
            $sampleMatch->setGameCreation($gameCreation);
            $sampleMatch->setGameDuration($gameDuration > 0 ? $gameDuration : null);
            $sampleMatch->setQueueId($queueId);
            $this->em->persist($sampleMatch);
        }

        $queueType = $queueId !== null && isset(self::QUEUE_ID_TO_QUEUE_TYPE[$queueId])
            ? self::QUEUE_ID_TO_QUEUE_TYPE[$queueId]
            : null;

        $existingPuuids = $this->sampleMatchParticipantRepository->findExistingPuuidsByMatchAndRegion($matchId, $region);

        foreach ($participants as $participantData) {
            $participantPuuid = $participantData['puuid'] ?? '';
            if ($participantPuuid === '') {
                continue;
            }
            if (isset($existingPuuids[$participantPuuid])) {
                continue;
            }

            $participantTier = $tier;
            $participantRank = $rank;
            if ($participantPuuid !== $puuid) {
                if ($fetchTierRankForAllParticipants) {
                    [$participantTier, $participantRank] = $this->resolveTierRankForPuuid(
                        $participantPuuid,
                        $region,
                        $platform,
                        $queueId,
                        $queueType,
                    );
                } else {
                    $participantTier = null;
                    $participantRank = null;
                }
            }

            $this->persistOneParticipant(
                $matchId,
                $region,
                $participantData,
                $participants,
                $gameDurationMinutes,
                $participantTier,
                $participantRank,
            );
        }

        $this->em->flush();
    }

    /**
     * Persist only participants from payload (no match create/load). For backfill when match already exists.
     * Uses one query for existing participants and in-memory tier/rank cache; single flush at end.
     */
    public function persistParticipantsFromPayload(
        array $matchPayload,
        string $region,
        string $seedPuuid,
        ?string $tier,
        ?string $rank,
        string $platform,
    ): void {
        $matchId = $matchPayload['metadata']['matchId'] ?? $matchPayload['info']['gameId'] ?? null;
        if (!$matchId) {
            return;
        }
        $matchId = (string) $matchId;
        $info = $matchPayload['info'] ?? [];
        $participants = $info['participants'] ?? [];
        $gameDuration = (int) ($info['gameDuration'] ?? 0);
        $gameDurationMinutes = $gameDuration > 0 ? $gameDuration / 60.0 : 1.0;
        $queueId = isset($info['queueId']) ? (int) $info['queueId'] : null;
        $queueType = $queueId !== null && isset(self::QUEUE_ID_TO_QUEUE_TYPE[$queueId])
            ? self::QUEUE_ID_TO_QUEUE_TYPE[$queueId]
            : null;

        $existingPuuids = $this->sampleMatchParticipantRepository->findExistingPuuidsByMatchAndRegion($matchId, $region);

        foreach ($participants as $participantData) {
            $participantPuuid = $participantData['puuid'] ?? '';
            if ($participantPuuid === '') {
                continue;
            }
            if (isset($existingPuuids[$participantPuuid])) {
                continue;
            }

            $participantTier = $tier;
            $participantRank = $rank;
            if ($participantPuuid !== $seedPuuid) {
                [$participantTier, $participantRank] = $this->resolveTierRankForPuuid(
                    $participantPuuid,
                    $region,
                    $platform,
                    $queueId,
                    $queueType,
                );
            }

            $this->persistOneParticipant(
                $matchId,
                $region,
                $participantData,
                $participants,
                $gameDurationMinutes,
                $participantTier,
                $participantRank,
            );
        }

        $this->em->flush();
    }

    /**
     * Resolve tier/rank for a puuid: in-memory cache → SamplePlayer DB → League-v4 (throttled). No flush inside.
     *
     * @return array{0: ?string, 1: ?string} [tier, rank]
     */
    private function resolveTierRankForPuuid(
        string $participantPuuid,
        string $region,
        string $platform,
        ?int $queueId,
        ?string $queueType,
    ): array {
        $cacheKey = $region . ':' . $participantPuuid;
        if (isset($this->tierRankCache[$cacheKey])) {
            return $this->tierRankCache[$cacheKey];
        }

        if ($queueType !== null) {
            $cached = $this->samplePlayerRepository->findByPuuidAndRegion($participantPuuid, $region);
            if ($cached !== null && $cached->getQueueType() === $queueType) {
                $result = [$cached->getTier(), $cached->getRank()];
                $this->tierRankCache[$cacheKey] = $result;
                return $result;
            }
        }

        $entries = null;
        for ($attempt = 0; $attempt < 2; $attempt++) {
            $this->throttler->waitIfNeeded(RiotApiThrottler::TYPE_LEAGUE_BY_PUUID);
            try {
                $entries = $this->riotApi->getLeagueEntriesByPuuid($platform, $participantPuuid);
                $this->throttler->recordRequest(RiotApiThrottler::TYPE_LEAGUE_BY_PUUID);
                break;
            } catch (\Throwable $e) {
                $this->throttler->recordRequest(RiotApiThrottler::TYPE_LEAGUE_BY_PUUID);
                if ($attempt === 0 && method_exists($e, 'getResponse') && $e->getResponse() !== null) {
                    $response = $e->getResponse();
                    if (method_exists($response, 'getStatusCode') && $response->getStatusCode() === 429) {
                        $seconds = self::DEFAULT_RETRY_AFTER_SECONDS;
                        $headers = $response->getHeaders(false);
                        if (isset($headers['retry-after'][0])) {
                            $fromHeader = (int) $headers['retry-after'][0];
                            $seconds = $fromHeader >= 1 && $fromHeader <= 300 ? $fromHeader : $seconds;
                        }
                        $this->logger->warning('429 Rate limit (league-by-puuid): waiting {seconds}s before retry.', [
                            'seconds' => $seconds,
                            'puuid' => substr($participantPuuid, 0, 8) . '…',
                            'region' => $region,
                        ]);
                        sleep($seconds);
                        continue;
                    }
                }
                $result = [null, null];
                $this->tierRankCache[$cacheKey] = $result;
                return $result;
            }
        }
        if ($entries === null) {
            $result = [null, null];
            $this->tierRankCache[$cacheKey] = $result;
            return $result;
        }

        $entry = $this->pickLeagueEntryForQueue($entries, $queueId, $queueType);
        if ($entry === null) {
            $result = [null, null];
            $this->tierRankCache[$cacheKey] = $result;
            return $result;
        }

        $tier = isset($entry['tier']) ? strtoupper((string) $entry['tier']) : null;
        $rank = isset($entry['rank']) ? strtoupper((string) $entry['rank']) : null;
        if ($tier !== null && ($rank === null || $rank === '') && \in_array($tier, ['MASTER', 'GRANDMASTER', 'CHALLENGER'], true)) {
            $rank = 'I';
        }

        $entryQueueType = $entry['queueType'] ?? $queueType;
        if ($tier !== null && $rank !== null && $entryQueueType !== null && $entryQueueType !== '') {
            $this->samplePlayerRepository->upsert($participantPuuid, $region, $tier, $rank, $entryQueueType);
            // No flush here; caller flushes once per match/batch
        }

        $result = [$tier, $rank];
        $this->tierRankCache[$cacheKey] = $result;
        return $result;
    }

    /**
     * @param array<int, array{queueType?: string, tier?: string, rank?: string, ...}> $entries
     */
    private function pickLeagueEntryForQueue(array $entries, ?int $queueId, ?string $queueType): ?array
    {
        $targetQueue = $queueType;
        if ($targetQueue === null && $queueId !== null && isset(self::QUEUE_ID_TO_QUEUE_TYPE[$queueId])) {
            $targetQueue = self::QUEUE_ID_TO_QUEUE_TYPE[$queueId];
        }
        if ($targetQueue === null) {
            return $entries[0] ?? null;
        }
        foreach ($entries as $entry) {
            if (($entry['queueType'] ?? '') === $targetQueue) {
                return $entry;
            }
        }
        return $entries[0] ?? null;
    }

    private function persistOneParticipant(
        string $matchId,
        string $region,
        array $participantData,
        array $allParticipants,
        float $gameDurationMinutes,
        ?string $tier,
        ?string $rank,
    ): void {
        $participantPuuid = $participantData['puuid'] ?? '';
        $teamId = (int) ($participantData['teamId'] ?? 0);
        $teamPosition = $this->normalizePosition($participantData['teamPosition'] ?? $participantData['individualPosition'] ?? '');
        $championId = (int) ($participantData['championId'] ?? 0);
        $championName = $participantData['championName'] ?? 'Unknown';
        $opponentChampionId = $this->findOpponentChampionId($allParticipants, $teamId, $teamPosition);

        $kills = (int) ($participantData['kills'] ?? 0);
        $deaths = (int) ($participantData['deaths'] ?? 0);
        $assists = (int) ($participantData['assists'] ?? 0);
        $totalCs = (int) ($participantData['totalMinionsKilled'] ?? 0) + (int) ($participantData['neutralMinionsKilled'] ?? 0);
        $totalDamage = (int) ($participantData['totalDamageDealtToChampions'] ?? 0);
        $goldEarned = (int) ($participantData['goldEarned'] ?? 0);
        $visionScore = (float) ($participantData['visionScore'] ?? 0);
        $teamKills = 0;
        foreach ($allParticipants as $p) {
            if ((int) ($p['teamId'] ?? 0) === $teamId) {
                $teamKills += (int) ($p['kills'] ?? 0);
            }
        }
        $killParticipation = $teamKills > 0 ? (($kills + $assists) / $teamKills) * 100.0 : null;
        $csPerMin = $gameDurationMinutes > 0 ? $totalCs / $gameDurationMinutes : 0.0;
        $damagePerMin = $gameDurationMinutes > 0 ? $totalDamage / $gameDurationMinutes : 0.0;
        $goldPerMin = $gameDurationMinutes > 0 ? $goldEarned / $gameDurationMinutes : null;

        $participant = new SampleMatchParticipant();
        $participant->setMatchId($matchId);
        $participant->setRegion($region);
        $participant->setPuuid($participantPuuid);
        $participant->setTier($tier);
        $participant->setRank($rank);
        $participant->setTeamPosition($teamPosition);
        $participant->setChampionId($championId);
        $participant->setChampionName($championName);
        $participant->setOpponentChampionId($opponentChampionId);
        $participant->setKills($kills);
        $participant->setDeaths($deaths);
        $participant->setAssists($assists);
        $participant->setCsPerMin(round($csPerMin, 4));
        $participant->setDamagePerMin(round($damagePerMin, 4));
        $participant->setVisionScore(round($visionScore, 4));
        $participant->setGoldPerMin($goldPerMin !== null ? round($goldPerMin, 4) : null);
        $participant->setKillParticipation($killParticipation !== null ? round($killParticipation, 4) : null);
        $participant->setWin((bool) ($participantData['win'] ?? false));
        $this->em->persist($participant);
    }

    public function matchExistsInSample(string $matchId, string $region): bool
    {
        return $this->sampleMatchRepository->existsByMatchIdAndRegion($matchId, $region);
    }

    private function normalizePosition(string $position): string
    {
        $key = strtoupper($position);
        return self::POSITION_MAP[$key] ?? 'UTILITY';
    }

    private function findOpponentChampionId(array $participants, int $myTeamId, string $myPosition): ?int
    {
        foreach ($participants as $p) {
            $teamId = (int) ($p['teamId'] ?? 0);
            if ($teamId === $myTeamId) {
                continue;
            }
            $pos = $this->normalizePosition($p['teamPosition'] ?? $p['individualPosition'] ?? '');
            if ($pos === $myPosition) {
                return (int) ($p['championId'] ?? 0);
            }
        }
        return null;
    }
}
