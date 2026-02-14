<?php

namespace App\Service;

use App\Entity\SampleMatch;
use App\Entity\SampleMatchParticipant;
use App\Repository\SampleMatchParticipantRepository;
use App\Repository\SampleMatchRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Persists full Match-v5 payload into sample_match and sample_match_participant.
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

    public function __construct(
        private readonly SampleMatchRepository $sampleMatchRepository,
        private readonly SampleMatchParticipantRepository $sampleMatchParticipantRepository,
        private readonly EntityManagerInterface $em
    ) {
    }

    /**
     * Persist full match payload for the given sampled puuid (and optional tier/rank).
     * If match already exists for (matchId, region), only add participant if not present.
     */
    public function persistMatchPayload(
        array $matchPayload,
        string $region,
        string $puuid,
        ?string $tier = null,
        ?string $rank = null
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

        $participantData = null;
        foreach ($participants as $p) {
            if (($p['puuid'] ?? '') === $puuid) {
                $participantData = $p;
                break;
            }
        }
        if (!$participantData) {
            return;
        }

        $existingParticipant = $this->sampleMatchParticipantRepository->findOneBy([
            'matchId' => $matchId,
            'region' => $region,
            'puuid' => $puuid,
        ]);
        if ($existingParticipant) {
            return;
        }

        $teamId = (int) ($participantData['teamId'] ?? 0);
        $teamPosition = $this->normalizePosition($participantData['teamPosition'] ?? $participantData['individualPosition'] ?? '');
        $championId = (int) ($participantData['championId'] ?? 0);
        $championName = $participantData['championName'] ?? 'Unknown';
        $opponentChampionId = $this->findOpponentChampionId($participants, $teamId, $teamPosition);

        $kills = (int) ($participantData['kills'] ?? 0);
        $deaths = (int) ($participantData['deaths'] ?? 0);
        $assists = (int) ($participantData['assists'] ?? 0);
        $totalCs = (int) ($participantData['totalMinionsKilled'] ?? 0) + (int) ($participantData['neutralMinionsKilled'] ?? 0);
        $totalDamage = (int) ($participantData['totalDamageDealtToChampions'] ?? 0);
        $goldEarned = (int) ($participantData['goldEarned'] ?? 0);
        $visionScore = (float) ($participantData['visionScore'] ?? 0);
        $teamKills = 0;
        foreach ($participants as $p) {
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
        $participant->setPuuid($puuid);
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
        $this->em->flush();
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
