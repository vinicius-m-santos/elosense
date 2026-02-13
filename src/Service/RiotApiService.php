<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class RiotApiService
{
    private const BASE_AMERICAS = 'https://americas.api.riotgames.com';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $riotApiKey
    ) {}

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
    public function getMatchIdsByPuuid(string $puuid, int $count = 10): array
    {
        $response = $this->httpClient->request('GET', self::BASE_AMERICAS . "/lol/match/v5/matches/by-puuid/{$puuid}/ids", [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
            'query' => ['count' => $count],
        ]);
        return $response->toArray();
    }

    public function getMatchById(string $matchId): array
    {
        $response = $this->httpClient->request('GET', self::BASE_AMERICAS . "/lol/match/v5/matches/{$matchId}", [
            'headers' => ['X-Riot-Token' => $this->riotApiKey],
        ]);
        return $response->toArray();
    }

    public function getMatchTimeline(string $matchId): ?array
    {
        try {
            $response = $this->httpClient->request('GET', self::BASE_AMERICAS . "/lol/match/v5/matches/{$matchId}/timeline", [
                'headers' => ['X-Riot-Token' => $this->riotApiKey],
            ]);
            return $response->toArray();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @return array{ matchId: string, champion: string, championId: int, result: bool, kda: string, csPerMin: float, damagePerMin: float, visionScore: float, deaths: int, earlyDeaths: int, soloDeaths: int, killParticipation: ?float, goldPerMin: ?float, score: string, gameDuration: ?int }
     */
    public function buildMatchMetrics(string $matchId, string $puuid): array
    {
        $match = $this->getMatchById($matchId);
        $timeline = $this->getMatchTimeline($matchId);
        $info = $match['info'] ?? [];
        $participants = $info['participants'] ?? [];
        $gameDuration = (int) ($info['gameDuration'] ?? 0);
        $queueId = isset($info['queueId']) ? (int) $info['queueId'] : null;
        $gameDurationMinutes = $gameDuration > 0 ? $gameDuration / 60.0 : 1.0;

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

        $score = $this->calculateScore($csPerMin, $deaths, $damagePerMin, $visionScore, $killParticipation ?? 0);

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
            'gameDuration' => $gameDuration,
            'queueId' => $queueId,
        ];
    }

    private function calculateScore(float $csPerMin, int $deaths, float $damagePerMin, float $visionScore, float $killParticipation): string
    {
        $csNorm = min(10, max(0, $csPerMin)) / 10.0;
        $deathsNorm = max(0, 1.0 - ($deaths / 15.0));
        $damageNorm = min(1.0, $damagePerMin / 1000.0);
        $visionNorm = min(1.0, $visionScore / 60.0);
        $kpNorm = min(1.0, $killParticipation / 100.0);

        $raw = $csNorm * 0.25 + $deathsNorm * 0.25 + $damageNorm * 0.20 + $visionNorm * 0.15 + $kpNorm * 0.15;
        $raw = max(0, min(1, $raw));

        if ($raw >= 0.9) return 'S';
        if ($raw >= 0.75) return 'A';
        if ($raw >= 0.55) return 'B';
        if ($raw >= 0.35) return 'C';
        return 'D';
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
