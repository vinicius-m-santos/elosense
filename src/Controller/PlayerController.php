<?php

namespace App\Controller;

use App\Entity\Player;
use App\Entity\PlayerMatch;
use App\Repository\PlayerMatchRepository;
use App\Repository\PlayerRepository;
use App\Service\RiotApiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class PlayerController extends AbstractController
{
    public function __construct(
        private readonly RiotApiService $riotApiService,
        private readonly PlayerRepository $playerRepository,
        private readonly PlayerMatchRepository $playerMatchRepository,
        private readonly EntityManagerInterface $em
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

        $cached = $this->playerMatchRepository->findLastByPuuid($puuid, 10);
        if (\count($cached) >= 10) {
            $list = array_map([$this, 'matchToArray'], $cached);
            return new JsonResponse($list);
        }

        try {
            $matchIds = $this->riotApiService->getMatchIdsByPuuid($puuid, 10);
        } catch (\Throwable $e) {
            throw new UnprocessableEntityHttpException('Failed to fetch matches: ' . $e->getMessage());
        }

        $list = [];
        foreach ($matchIds as $matchId) {
            $existing = $this->playerMatchRepository->findByMatchIdAndPuuid($matchId, $puuid);
            if ($existing) {
                $list[] = $this->matchToArray($existing);
                continue;
            }
            try {
                $metrics = $this->riotApiService->buildMatchMetrics($matchId, $puuid);
            } catch (\Throwable) {
                continue;
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
            $match->setQueueId($metrics['queueId'] ?? null);
            $this->em->persist($match);
            $list[] = $this->metricsToArray($metrics);
        }
        $this->em->flush();

        return new JsonResponse($list);
    }

    #[Route('/match/{matchId}', name: 'api_match_detail', methods: ['GET'])]
    public function matchDetail(Request $request, string $matchId): JsonResponse
    {
        $puuid = $request->query->get('puuid', '');
        if ($puuid === '') {
            throw new UnprocessableEntityHttpException('puuid is required');
        }

        $existing = $this->playerMatchRepository->findByMatchIdAndPuuid($matchId, $puuid);
        if ($existing) {
            return new JsonResponse($this->matchToArray($existing));
        }

        try {
            $metrics = $this->riotApiService->buildMatchMetrics($matchId, $puuid);
        } catch (\Throwable $e) {
            throw new NotFoundHttpException('Match not found: ' . $e->getMessage());
        }

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
            $match->setScore($metrics['score']);
            $match->setGameDuration($metrics['gameDuration']);
            $match->setQueueId($metrics['queueId'] ?? null);
            $this->em->persist($match);
            $this->em->flush();
        }

        return new JsonResponse($this->metricsToArray($metrics));
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
            'queueId' => $m->getQueueId(),
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
            'gameDuration' => $metrics['gameDuration'],
            'queueId' => $metrics['queueId'] ?? null,
        ];
    }
}
