<?php

namespace App\Service;

use App\Entity\Player;
use App\Repository\PlayerRepository;
use App\Service\PlayerQueueRankService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class PlayerService
{
    public function __construct(
        private readonly PlayerRepository $playerRepository,
        private readonly RiotApiService $riotApiService,
        private readonly PlayerQueueRankService $playerQueueRankService,
        private readonly EntityManagerInterface $em
    ) {}

    public function getPlayerByRiotId(string $gameName, string $tagLine, string $region): Player
    {
        $gameName = trim($gameName);
        $tagLine = trim($tagLine, "# \t\n\r");
        $tagLine = self::normalizeTagLine($tagLine);
        $region = trim($region);

        $player = $this->playerRepository->findByRiotId($gameName, $tagLine);
        if (!$player) {
            try {
                $puuid = $this->riotApiService->getPuuidByRiotId($gameName, $tagLine);
                $player = new Player();
                $player->setPuuid($puuid);
                $player->setName($gameName);
                $player->setTag($tagLine);
                $this->playerRepository->add($player, true);
            } catch (\Throwable $e) {
                throw new UnprocessableEntityHttpException('Player not found: ' . $e->getMessage());
            }
        }

        $rawEntries = $this->riotApiService->getLeagueEntriesByPuuid($region, $player->getPuuid());

        foreach ($rawEntries as $entry) {
            $queueType = trim($entry['queueType'] ?? '');
            $tier = trim($entry['tier'] ?? '');
            $rank = trim($entry['rank'] ?? '');

            if ($queueType === '' || $tier === '' || $rank === '') {
                continue;
            }

            $this->playerQueueRankService->upsert($player, $region, $queueType, $tier, $rank, true);
        }

        try {
            $summoner = $this->riotApiService->getSummonerByPuuid($region, $player->getPuuid());
            $player->setProfileIconId(isset($summoner['profileIconId']) ? (int) $summoner['profileIconId'] : null);
            $this->em->flush();
        } catch (\Throwable) {
            // Keep profileIconId as-is (null or previous value); player and queueRanks are already saved
        }

        return $player;
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
