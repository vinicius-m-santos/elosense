<?php

namespace App\Controller;

use App\Entity\Player;
use App\Entity\PlayerMatch;
use App\Repository\PlayerMatchRepository;
use App\Repository\PlayerRepository;
use App\Service\BenchmarkService;
use App\Service\MatchAnalysisService;
use App\Service\MatchScoreCalculator;
use App\Service\RiotApiService;
use App\Service\SampleMatchStorageService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;

#[Route('/api')]
class PlayerController extends AbstractController
{
    public function __construct(
        private readonly RiotApiService $riotApiService,
        private readonly PlayerRepository $playerRepository,
        private readonly PlayerMatchRepository $playerMatchRepository,
        private readonly SampleMatchStorageService $sampleMatchStorage,
        private readonly BenchmarkService $benchmarkService,
        private readonly MatchAnalysisService $matchAnalysisService,
        private readonly MatchScoreCalculator $matchScoreCalculator,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger
    ) {}

    #[Route('/player', name: 'api_player', methods: ['GET'])]
    public function player(Request $request): JsonResponse
    {
        $gameName = $request->query->get('gameName', '');
        $tagLine = $request->query->get('tagLine', '');
        if ($gameName === '' || $tagLine === '') {
            throw new UnprocessableEntityHttpException('gameName and tagLine are required');
        }

        try {
            $puuid = $this->riotApiService->getPuuidByRiotId($gameName, $tagLine);
        } catch (\Throwable $e) {
            throw new UnprocessableEntityHttpException('Player not found: ' . $e->getMessage());
        }

        $player = $this->playerRepository->findByPuuid($puuid);
        if (!$player) {
            $player = new Player();
            $player->setPuuid($puuid);
            $player->setName($gameName);
            $player->setTag($tagLine);
            $this->em->persist($player);
            $this->em->flush();
        }

        return new JsonResponse(['puuid' => $puuid]);
    }

    /**
     * Get the player's league entries for all queues (from Riot League-v4).
     * Requires puuid and region. Returns entries with queueType, tier, rank, leaguePoints, wins, losses.
     */
    #[Route('/player/rank', name: 'api_player_rank', methods: ['GET'])]
    public function playerRank(Request $request): JsonResponse
    {
        $puuid = $request->query->get('puuid', '');
        $region = $request->query->get('region', '');
        if ($puuid === '' || $region === '') {
            return new JsonResponse(['entries' => []]);
        }
        $platform = strtolower($region);

        try {
            $rawEntries = $this->riotApiService->getLeagueEntriesByPuuid($platform, $puuid);
        } catch (\Throwable $e) {
            $this->logger->warning('Player rank: Riot API error', [
                'platform' => $platform,
                'puuid' => substr($puuid, 0, 8) . '…',
                'message' => $e->getMessage(),
                'exception' => $e::class,
            ]);
            $payload = ['entries' => [], 'profileIconId' => null];
            if ($this->getParameter('kernel.environment') === 'dev') {
                $payload['errorDetail'] = $this->rankErrorDetail($e);
            }
            return new JsonResponse($payload);
        }

        $entries = [];
        foreach ($rawEntries as $entry) {
            $queueType = $entry['queueType'] ?? '';
            $tier = isset($entry['tier']) ? strtoupper((string) $entry['tier']) : '';
            $rank = isset($entry['rank']) ? strtoupper((string) $entry['rank']) : '';
            $entries[] = [
                'queueType' => $queueType,
                'tier' => $tier,
                'rank' => $rank,
                'leaguePoints' => (int) ($entry['leaguePoints'] ?? 0),
                'wins' => (int) ($entry['wins'] ?? 0),
                'losses' => (int) ($entry['losses'] ?? 0),
            ];
        }

        $profileIconId = null;
        try {
            $summoner = $this->riotApiService->getSummonerByPuuid($platform, $puuid);
            $profileIconId = isset($summoner['profileIconId']) ? (int) $summoner['profileIconId'] : null;
        } catch (\Throwable) {
            // Keep profileIconId null; entries are already available
        }

        return new JsonResponse([
            'entries' => $entries,
            'profileIconId' => $profileIconId,
        ]);
    }

    private function rankErrorDetail(\Throwable $e): string
    {
        $msg = strtolower($e->getMessage());
        if (str_contains($msg, '404') || str_contains($msg, 'not found')) {
            return 'summoner_not_found';
        }
        if (str_contains($msg, '403') || str_contains($msg, 'forbidden')) {
            return 'forbidden';
        }
        return 'api_error';
    }

    #[Route('/matches', name: 'api_matches', methods: ['GET'])]
    public function matches(Request $request): JsonResponse
    {
        $puuid = $request->query->get('puuid', '');
        if ($puuid === '') {
            throw new UnprocessableEntityHttpException('puuid is required');
        }

        $player = $this->playerRepository->findByPuuid($puuid);
        if (!$player) {
            throw new NotFoundHttpException('Player not found');
        }

        $region = $request->query->get('region', '');
        $tier = $request->query->get('tier', '');
        $rank = $request->query->get('rank', '');
        $platform = $region !== '' ? $region : null;

        $cached = $this->playerMatchRepository->findLastByPuuid($puuid, 10);
        $allHaveTimestamp = \count($cached) > 0 && \count(array_filter($cached, fn(PlayerMatch $m) => $m->getGameEndTimestamp() !== null)) === \count($cached);
        if (\count($cached) >= 10 && $allHaveTimestamp) {
            $list = array_map(fn(PlayerMatch $m) => $this->enrichMatchResponse($this->matchToArray($m), $region, $tier, $rank), $cached);
            $list = $this->sortMatchesByTimestamp($list);
            return new JsonResponse($list);
        }

        try {
            $matchIds = $this->riotApiService->getMatchIdsByPuuid($puuid, 10, $platform);
        } catch (\Throwable $e) {
            throw new UnprocessableEntityHttpException('Failed to fetch matches: ' . $e->getMessage());
        }

        $list = [];
        foreach ($matchIds as $matchId) {
            $existing = $this->playerMatchRepository->findByMatchIdAndPuuid($matchId, $puuid);
            if ($existing !== null) {
                if ($existing->getGameEndTimestamp() === null) {
                    try {
                        $matchPayload = $this->riotApiService->getMatchById($matchId, $platform);
                        $timeline = $this->riotApiService->getMatchTimeline($matchId, $platform);
                        $metrics = $this->riotApiService->buildMatchMetricsFromPayload($matchPayload, $timeline, $puuid, $platform);
                        $ts = $metrics['gameEndTimestamp'] ?? null;
                        if ($ts !== null) {
                            $existing->setGameEndTimestamp($ts);
                            $this->em->persist($existing);
                        }
                    } catch (\Throwable) {
                        // keep existing without timestamp
                    }
                }
                $list[] = $this->enrichMatchResponse($this->matchToArray($existing), $region, $tier, $rank);
                continue;
            }
            try {
                $matchPayload = $this->riotApiService->getMatchById($matchId, $platform);
                $timeline = $this->riotApiService->getMatchTimeline($matchId, $platform);
                $metrics = $this->riotApiService->buildMatchMetricsFromPayload($matchPayload, $timeline, $puuid, $platform);
            } catch (\Throwable) {
                continue;
            }
            if ($region !== '') {
                $this->sampleMatchStorage->persistMatchPayload($matchPayload, strtoupper($region), $puuid, null, null);
            }
            $match = new PlayerMatch();
            $match->setMatchId($metrics['matchId']);
            $match->setPlayer($player);
            $match->setChampion($metrics['champion']);
            $match->setChampionId($metrics['championId']);
            $match->setResult($metrics['result']);
            $match->setKda($metrics['kda']);
            $match->setCsPerMin($metrics['csPerMin']);
            $match->setDamagePerMin($metrics['damagePerMin']);
            $match->setVisionScore($metrics['visionScore']);
            $match->setDeaths($metrics['deaths']);
            $match->setEarlyDeaths($metrics['earlyDeaths']);
            $match->setSoloDeaths($metrics['soloDeaths']);
            $match->setKillParticipation($metrics['killParticipation']);
            $match->setGoldPerMin($metrics['goldPerMin']);
            $match->setScore($metrics['score']);
            $match->setGameDuration($metrics['gameDuration']);
            $match->setGameEndTimestamp($metrics['gameEndTimestamp'] ?? null);
            $match->setQueueId($metrics['queueId'] ?? null);
            $match->setTeamPosition($metrics['teamPosition'] ?? null);
            $match->setOpponentChampionId($metrics['opponentChampionId'] ?? null);
            $this->em->persist($match);
            $list[] = $this->enrichMatchResponse($this->metricsToArray($metrics), $region, $tier, $rank);
        }
        $this->em->flush();

        $list = $this->sortMatchesByTimestamp($list);
        return new JsonResponse($list);
    }

    #[Route('/match/{matchId}', name: 'api_match_detail', methods: ['GET'])]
    public function matchDetail(Request $request, string $matchId): JsonResponse
    {
        $puuid = $request->query->get('puuid', '');
        if ($puuid === '') {
            throw new UnprocessableEntityHttpException('puuid is required');
        }

        $region = $request->query->get('region', '');
        $tier = $request->query->get('tier', '');
        $rank = $request->query->get('rank', '');
        $platform = $region !== '' ? $region : null;

        $existing = $this->playerMatchRepository->findByMatchIdAndPuuid($matchId, $puuid);
        if ($existing) {
            return new JsonResponse($this->enrichMatchResponse($this->matchToArray($existing), $region, $tier, $rank));
        }

        try {
            $matchPayload = $this->riotApiService->getMatchById($matchId, $platform);
            $timeline = $this->riotApiService->getMatchTimeline($matchId, $platform);
            $metrics = $this->riotApiService->buildMatchMetricsFromPayload($matchPayload, $timeline, $puuid, $platform);
        } catch (\Throwable $e) {
            throw new NotFoundHttpException('Match not found: ' . $e->getMessage());
        }

        if ($region !== '') {
            $this->sampleMatchStorage->persistMatchPayload($matchPayload, strtoupper($region), $puuid, null, null);
        }

        $enriched = $this->enrichMatchResponse($this->metricsToArray($metrics), $region, $tier, $rank);

        $player = $this->playerRepository->findByPuuid($puuid);
        if ($player) {
            $match = new PlayerMatch();
            $match->setMatchId($metrics['matchId']);
            $match->setPlayer($player);
            $match->setChampion($metrics['champion']);
            $match->setChampionId($metrics['championId']);
            $match->setResult($metrics['result']);
            $match->setKda($metrics['kda']);
            $match->setCsPerMin($metrics['csPerMin']);
            $match->setDamagePerMin($metrics['damagePerMin']);
            $match->setVisionScore($metrics['visionScore']);
            $match->setDeaths($metrics['deaths']);
            $match->setEarlyDeaths($metrics['earlyDeaths']);
            $match->setSoloDeaths($metrics['soloDeaths']);
            $match->setKillParticipation($metrics['killParticipation']);
            $match->setGoldPerMin($metrics['goldPerMin']);
            $match->setScore($enriched['score']);
            $match->setGameDuration($metrics['gameDuration']);
            $match->setGameEndTimestamp($metrics['gameEndTimestamp'] ?? null);
            $match->setQueueId($metrics['queueId'] ?? null);
            $match->setTeamPosition($metrics['teamPosition'] ?? null);
            $match->setOpponentChampionId($metrics['opponentChampionId'] ?? null);
            $this->em->persist($match);
            $this->em->flush();
        }

        return new JsonResponse($enriched);
    }

    /**
     * Add tier/rank (when provided), idealBenchmarks and analysis to match payload.
     *
     * @param array<string, mixed> $payload base match data (from matchToArray or metricsToArray)
     * @return array<string, mixed>
     */
    private function enrichMatchResponse(array $payload, string $region, string $tier, string $rank): array
    {
        if ($tier !== '') {
            $payload['tier'] = $tier;
        }
        if ($rank !== '') {
            $payload['rank'] = $rank;
        }
        $queueId = $payload['queueId'] ?? null;
        $teamPosition = $payload['teamPosition'] ?? null;
        $tiersWithoutRank = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];
        $tierAllowsEmptyRank = $tier !== '' && \in_array(strtoupper($tier), $tiersWithoutRank, true);
        $rankRequired = !$tierAllowsEmptyRank && $rank === '';
        if ($region === '' || $tier === '' || $rankRequired || $teamPosition === null || $teamPosition === '') {
            $payload['idealBenchmarks'] = null;
            $payload['analysis'] = ['insights' => [], 'summary' => $this->matchAnalysisService->analyze([], null)['summary']];
            return $payload;
        }
        $context = [
            'region' => $region,
            'queueId' => $queueId,
            'tier' => $tier,
            'rank' => $rank,
            'teamPosition' => $teamPosition,
            'championId' => $payload['championId'] ?? null,
            'opponentChampionId' => $payload['opponentChampionId'] ?? null,
        ];
        $benchmark = $this->benchmarkService->getBenchmark($context);
        $payload['idealBenchmarks'] = $benchmark !== null ? $this->benchmarkService->benchmarkToIdealArray($benchmark) : null;
        $payload['analysis'] = $this->matchAnalysisService->analyze([
            'csPerMin' => $payload['csPerMin'] ?? null,
            'damagePerMin' => $payload['damagePerMin'] ?? null,
            'visionScore' => $payload['visionScore'] ?? null,
            'goldPerMin' => $payload['goldPerMin'] ?? null,
            'killParticipation' => $payload['killParticipation'] ?? null,
            'deaths' => $payload['deaths'] ?? null,
        ], $benchmark);

        $scoreContext = [
            'teamPosition' => $payload['teamPosition'] ?? null,
            'champion' => $payload['champion'] ?? null,
            'championId' => $payload['championId'] ?? null,
            'tier' => $tier,
            'rank' => $rank,
            'gameDurationSeconds' => isset($payload['gameDuration']) ? (int) $payload['gameDuration'] : null,
            'benchmark' => $benchmark,
        ];
        $payload['score'] = $this->matchScoreCalculator->calculateScore([
            'csPerMin' => (float) ($payload['csPerMin'] ?? 0),
            'deaths' => (int) ($payload['deaths'] ?? 0),
            'damagePerMin' => (float) ($payload['damagePerMin'] ?? 0),
            'visionScore' => (float) ($payload['visionScore'] ?? 0),
            'killParticipation' => $payload['killParticipation'] !== null ? (float) $payload['killParticipation'] : null,
        ], $scoreContext);

        return $payload;
    }

    /**
     * @param array<int, array<string, mixed>> $list
     * @return array<int, array<string, mixed>>
     */
    private function sortMatchesByTimestamp(array $list): array
    {
        usort($list, function (array $a, array $b): int {
            $ta = $a['gameEndTimestamp'] ?? 0;
            $tb = $b['gameEndTimestamp'] ?? 0;
            return $tb <=> $ta;
        });
        return array_values($list);
    }

    private function matchToArray(PlayerMatch $m): array
    {
        return [
            'matchId' => $m->getMatchId(),
            'champion' => $m->getChampion(),
            'championId' => $m->getChampionId(),
            'result' => $m->getResult(),
            'kda' => $m->getKda(),
            'csPerMin' => $m->getCsPerMin(),
            'damagePerMin' => $m->getDamagePerMin(),
            'visionScore' => $m->getVisionScore(),
            'deaths' => $m->getDeaths(),
            'earlyDeaths' => $m->getEarlyDeaths(),
            'soloDeaths' => $m->getSoloDeaths(),
            'killParticipation' => $m->getKillParticipation(),
            'goldPerMin' => $m->getGoldPerMin(),
            'score' => $m->getScore(),
            'gameDuration' => $m->getGameDuration(),
            'gameEndTimestamp' => $m->getGameEndTimestamp(),
            'queueId' => $m->getQueueId(),
            'teamPosition' => $m->getTeamPosition(),
            'opponentChampionId' => $m->getOpponentChampionId(),
        ];
    }

    private function metricsToArray(array $metrics): array
    {
        return [
            'matchId' => $metrics['matchId'],
            'champion' => $metrics['champion'],
            'championId' => $metrics['championId'],
            'result' => $metrics['result'],
            'kda' => $metrics['kda'],
            'csPerMin' => $metrics['csPerMin'],
            'damagePerMin' => $metrics['damagePerMin'],
            'visionScore' => $metrics['visionScore'],
            'deaths' => $metrics['deaths'],
            'earlyDeaths' => $metrics['earlyDeaths'],
            'soloDeaths' => $metrics['soloDeaths'],
            'killParticipation' => $metrics['killParticipation'],
            'goldPerMin' => $metrics['goldPerMin'],
            'score' => $metrics['score'],
            'gameDuration' => $metrics['gameDuration'] ?? null,
            'gameEndTimestamp' => $metrics['gameEndTimestamp'] ?? null,
            'queueId' => $metrics['queueId'] ?? null,
            'teamPosition' => $metrics['teamPosition'] ?? null,
            'opponentChampionId' => $metrics['opponentChampionId'] ?? null,
        ];
    }
}
