<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class RiotApiService
{
    private const BASE_AMERICAS = 'https://americas.api.riotgames.com';

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
        private readonly HttpClientInterface $httpClient,
        private readonly string $riotApiKey,
        private readonly MatchScoreCalculator $matchScoreCalculator
    ) {}

    private function getRegionalBaseUrl(?string $platform): string
    {
        if ($platform === null || $platform === '') {
            return self::BASE_AMERICAS;
        }
        $region = RiotRegionResolver::platformToRegion($platform);
        return RiotRegionResolver::regionBaseUrl($region);
    }

    private function getPlatformBaseUrl(string $platform): string
    {
        return RiotRegionResolver::platformBaseUrl($platform);
    }

    /**
     * League-v4: entries by queue, tier, division (paginated).
     * Queue: RANKED_SOLO_5x5 | RANKED_FLEX_SR. Tier: IRON..CHALLENGER. Division: I, II, III, IV.
     *
     * @return array<int, array{summonerId: string, leaguePoints: int, wins: int, losses: int, tier: string, rank: string, queueType: string, ...}>
     */
    public function getLeagueEntries(string $platform, string $queue, string $tier, string $division, int $page = 1): array
    {
        $base = $this->getPlatformBaseUrl($platform);
        $url = $base . '/lol/league/v4/entries/' . rawurlencode($queue) . '/' . rawurlencode($tier) . '/' . rawurlencode($division);
        $response = $this->httpClient->request('GET', $url, [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
            'query' => ['page' => $page],
        ]);
        return $response->toArray();
    }

    /**
     * League-v4: Master league by queue (no division).
     *
     * @return array{leagueId: string, tier: string, entries: array<int, array{summonerId: string, tier: string, rank: string, ...}>}
     */
    public function getMasterLeague(string $platform, string $queue): array
    {
        $base = $this->getPlatformBaseUrl($platform);
        $response = $this->httpClient->request('GET', $base . '/lol/league/v4/masterleagues/by-queue/' . rawurlencode($queue), [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
        ]);
        return $response->toArray();
    }

    /**
     * League-v4: Grandmaster league by queue.
     *
     * @return array{leagueId: string, tier: string, entries: array<int, array{summonerId: string, tier: string, rank: string, ...}>}
     */
    public function getGrandmasterLeague(string $platform, string $queue): array
    {
        $base = $this->getPlatformBaseUrl($platform);
        $response = $this->httpClient->request('GET', $base . '/lol/league/v4/grandmasterleagues/by-queue/' . rawurlencode($queue), [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
        ]);
        return $response->toArray();
    }

    /**
     * League-v4: Challenger league by queue.
     *
     * @return array{leagueId: string, tier: string, entries: array<int, array{summonerId: string, tier: string, rank: string, ...}>}
     */
    public function getChallengerLeague(string $platform, string $queue): array
    {
        $base = $this->getPlatformBaseUrl($platform);
        $response = $this->httpClient->request('GET', $base . '/lol/league/v4/challengerleagues/by-queue/' . rawurlencode($queue), [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
        ]);
        return $response->toArray();
    }

    /**
     * Summoner-v4: get summoner by encrypted PUUID. Returns id (summonerId), puuid, etc.
     *
     * @return array{id: string, accountId: string, puuid: string, name: string, profileIconId: int, revisionDate: int, summonerLevel: int}
     */
    public function getSummonerByPuuid(string $platform, string $puuid): array
    {
        $base = $this->getPlatformBaseUrl($platform);
        $encrypted = rawurlencode($puuid);
        $response = $this->httpClient->request('GET', $base . '/lol/summoner/v4/summoners/by-puuid/' . $encrypted, [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
        ]);
        return $response->toArray();
    }

    /**
     * League-v4: all league entries for a summoner (all queues). Returns array of LeagueEntryDTO.
     *
     * @return array<int, array{tier: string, rank: string, queueType: string, leaguePoints: int, ...}>
     */
    public function getLeagueEntriesByPuuid(string $platform, string $puuid): array
    {
        $base = $this->getPlatformBaseUrl($platform);
        $encrypted = rawurlencode($puuid);
        $response = $this->httpClient->request('GET', $base . '/lol/league/v4/entries/by-puuid/' . $encrypted, [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
        ]);
        return $response->toArray();
    }

    public function getPuuidByRiotId(string $gameName, string $tagLine): string
    {
        $gameName = trim($gameName);
        $tagLine = trim($tagLine, "# \t\n\r");
        $tagLine = self::normalizeTagLine($tagLine);

        $url = self::BASE_AMERICAS . '/riot/account/v1/accounts/by-riot-id/'
            . $gameName . '/' . $tagLine;

        $response = $this->httpClient->request('GET', $url, [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
        ]);
        $data = $response->toArray();
        return $data['puuid'];
    }

    /**
     * @return string[]
     */
    public function getMatchIdsByPuuid(string $puuid, int $count = 10, ?string $platform = null): array
    {
        $base = $this->getRegionalBaseUrl($platform);
        $response = $this->httpClient->request('GET', $base . "/lol/match/v5/matches/by-puuid/{$puuid}/ids", [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
            'query' => ['count' => $count],
        ]);
        return $response->toArray();
    }

    public function getMatchById(string $matchId, ?string $platform = null): array
    {
        $base = $this->getRegionalBaseUrl($platform);
        $response = $this->httpClient->request('GET', $base . "/lol/match/v5/matches/{$matchId}", [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
        ]);
        return $response->toArray();
    }

    public function getMatchTimeline(string $matchId, ?string $platform = null): ?array
    {
        $base = $this->getRegionalBaseUrl($platform);
        try {
            $response = $this->httpClient->request('GET', $base . "/lol/match/v5/matches/{$matchId}/timeline", [
                'headers' => ['X-Riot-Token' => $this->riotApiKey],
            ]);
            return $response->toArray();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Build metrics from already-fetched match payload (and optional timeline). Use to avoid double fetch when enriching sample.
     *
     * @return array{ matchId: string, champion: string, championId: int, result: bool, kda: string, csPerMin: float, damagePerMin: float, visionScore: float, deaths: int, earlyDeaths: int, soloDeaths: int, killParticipation: ?float, goldPerMin: ?float, score: string, gameDuration: ?int, queueId: ?int, teamPosition: string, opponentChampionId: ?int }
     */
    public function buildMatchMetricsFromPayload(array $matchPayload, ?array $timeline, string $puuid, ?string $platform = null): array
    {
        $matchId = (string) ($matchPayload['metadata']['matchId'] ?? $matchPayload['info']['gameId'] ?? '');
        if ($matchId === '') {
            throw new \RuntimeException('Match payload missing matchId');
        }
        if ($timeline === null) {
            $timeline = $this->getMatchTimeline($matchId, $platform);
        }
        return $this->buildMetricsFromMatchInfo($matchPayload['info'] ?? [], $matchId, $timeline, $puuid);
    }

    /**
     * @return array{ matchId: string, champion: string, championId: int, result: bool, kda: string, csPerMin: float, damagePerMin: float, visionScore: float, deaths: int, earlyDeaths: int, soloDeaths: int, killParticipation: ?float, goldPerMin: ?float, score: string, gameDuration: ?int, queueId: ?int, teamPosition: string, opponentChampionId: ?int }
     */
    public function buildMatchMetrics(string $matchId, string $puuid, ?string $platform = null): array
    {
        $match = $this->getMatchById($matchId, $platform);
        $timeline = $this->getMatchTimeline($matchId, $platform);
        $info = $match['info'] ?? [];
        $queueId = isset($info['queueId']) ? (int) $info['queueId'] : null;
        $gameDuration = (int) ($info['gameDuration'] ?? 0);
        $result = $this->buildMetricsFromMatchInfo($info, $matchId, $timeline, $puuid);
        $result['gameDuration'] = $gameDuration > 0 ? $gameDuration : null;
        $result['queueId'] = $queueId;
        $result['gameEndTimestamp'] = $result['gameEndTimestamp'] ?? (isset($info['gameEndTimestamp']) ? (int) $info['gameEndTimestamp'] : (isset($info['gameCreation']) ? (int) $info['gameCreation'] : null));
        return $result;
    }

    /**
     * @param array<string, mixed> $info match['info']
     * @return array{ matchId: string, champion: string, championId: int, result: bool, kda: string, csPerMin: float, damagePerMin: float, visionScore: float, deaths: int, earlyDeaths: int, soloDeaths: int, killParticipation: ?float, goldPerMin: ?float, score: string, gameDuration: ?int, queueId: ?int, teamPosition: string, opponentChampionId: ?int }
     */
    private function buildMetricsFromMatchInfo(array $info, string $matchId, ?array $timeline, string $puuid): array
    {
        $participants = $info['participants'] ?? [];
        $gameDuration = (int) ($info['gameDuration'] ?? 0);
        $queueId = isset($info['queueId']) ? (int) $info['queueId'] : null;
        $gameDurationMinutes = $gameDuration > 0 ? $gameDuration / 60.0 : 1.0;
        $gameEndTimestamp = isset($info['gameEndTimestamp']) ? (int) $info['gameEndTimestamp'] : (isset($info['gameCreation']) ? (int) $info['gameCreation'] : null);

        $participant = null;
        foreach ($participants as $p) {
            if (($p['puuid'] ?? '') === $puuid) {
                $participant = $p;
                break;
            }
        }
        if (!$participant) {
            throw new \RuntimeException('Participant not found in match');
        }

        $teamId = $participant['teamId'] ?? 0;
        $teamKills = 0;
        foreach ($participants as $p) {
            if (($p['teamId'] ?? 0) === $teamId) {
                $teamKills += (int) ($p['kills'] ?? 0);
            }
        }

        $kills = (int) ($participant['kills'] ?? 0);
        $deaths = (int) ($participant['deaths'] ?? 0);
        $assists = (int) ($participant['assists'] ?? 0);
        $totalCs = (int) ($participant['totalMinionsKilled'] ?? 0) + (int) ($participant['neutralMinionsKilled'] ?? 0);
        $totalDamage = (int) ($participant['totalDamageDealtToChampions'] ?? 0);
        $goldEarned = (int) ($participant['goldEarned'] ?? 0);
        $visionScore = (float) ($participant['visionScore'] ?? 0);
        $championName = $participant['championName'] ?? 'Unknown';
        $championId = (int) ($participant['championId'] ?? 0);
        $win = (bool) ($participant['win'] ?? false);
        $teamPosition = $this->normalizePosition($participant['teamPosition'] ?? $participant['individualPosition'] ?? '');
        $opponentChampionId = $this->findOpponentChampionId($participants, $teamId, $teamPosition);

        $csPerMin = $gameDurationMinutes > 0 ? $totalCs / $gameDurationMinutes : 0.0;
        $damagePerMin = $gameDurationMinutes > 0 ? $totalDamage / $gameDurationMinutes : 0.0;
        $goldPerMin = $gameDurationMinutes > 0 ? $goldEarned / $gameDurationMinutes : 0.0;
        $killParticipation = $teamKills > 0 ? (($kills + $assists) / $teamKills) * 100.0 : null;
        $kdaStr = "{$kills} / {$deaths} / {$assists}";

        $participantId = $participant['participantId'] ?? null;
        $earlyDeaths = 0;
        $soloDeaths = 0;
        if ($timeline && $participantId !== null) {
            $frames = $timeline['info']['frames'] ?? [];
            foreach ($frames as $frame) {
                $timestamp = (int) ($frame['timestamp'] ?? 0);
                $events = $frame['events'] ?? [];
                foreach ($events as $event) {
                    if (($event['type'] ?? '') !== 'CHAMPION_KILL') {
                        continue;
                    }
                    $victimId = $event['victimId'] ?? null;
                    if ($victimId != $participantId) {
                        continue;
                    }
                    if ($timestamp < 600000) {
                        $earlyDeaths++;
                    }
                    $assistingIds = $event['assistingParticipantIds'] ?? [];
                    if (\count($assistingIds) === 0) {
                        $soloDeaths++;
                    }
                }
            }
        }

        $metricsForScore = [
            'csPerMin' => $csPerMin,
            'deaths' => $deaths,
            'damagePerMin' => $damagePerMin,
            'visionScore' => $visionScore,
            'killParticipation' => $killParticipation,
        ];
        $contextForScore = [
            'teamPosition' => $teamPosition,
            'champion' => $championName,
            'championId' => $championId,
            'gameDurationSeconds' => $gameDuration > 0 ? $gameDuration : null,
        ];
        $score = $this->matchScoreCalculator->calculateScore($metricsForScore, $contextForScore);

        return [
            'matchId' => $matchId,
            'champion' => $championName,
            'championId' => $championId,
            'result' => $win,
            'kda' => $kdaStr,
            'csPerMin' => round($csPerMin, 2),
            'damagePerMin' => round($damagePerMin, 2),
            'visionScore' => round($visionScore, 2),
            'deaths' => $deaths,
            'earlyDeaths' => $earlyDeaths,
            'soloDeaths' => $soloDeaths,
            'killParticipation' => $killParticipation !== null ? round($killParticipation, 2) : null,
            'goldPerMin' => round($goldPerMin, 2),
            'score' => $score,
            'gameDuration' => $gameDuration > 0 ? $gameDuration : null,
            'gameEndTimestamp' => $gameEndTimestamp,
            'queueId' => $queueId,
            'teamPosition' => $teamPosition,
            'opponentChampionId' => $opponentChampionId,
        ];
    }

    private function normalizePosition(string $position): string
    {
        $key = strtoupper(trim($position));
        return self::POSITION_MAP[$key] ?? 'UTILITY';
    }

    /**
     * @param array<int, array<string, mixed>> $participants
     */
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

    /**
     * Normaliza tag line: mantém apenas A-Z, a-z e 0-9 (evita caracteres invisíveis U+2066/U+2069 e outros Unicode).
     */
    private static function normalizeTagLine(string $tagLine): string
    {
        $normalized = preg_replace('/[^a-zA-Z0-9]/', '', $tagLine);
        return $normalized !== '' ? $normalized : $tagLine;
    }
}
