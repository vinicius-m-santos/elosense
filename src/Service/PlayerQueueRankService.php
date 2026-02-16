<?php

namespace App\Service;

use App\Entity\Player;
use App\Entity\PlayerQueueRank;
use App\Repository\PlayerQueueRankRepository;

final class PlayerQueueRankService
{
    public function __construct(
        private readonly PlayerQueueRankRepository $playerQueueRankRepository
    ) {}

    public function add(PlayerQueueRank $playerQueueRank, bool $flush = true): PlayerQueueRank
    {
        return $this->playerQueueRankRepository->add($playerQueueRank, $flush);
    }

    public function upsert(Player $player, string $region, string $queueType, string $tier, string $rank, bool $flush = true): PlayerQueueRank
    {
        $existing = $this->playerQueueRankRepository->findOneByPlayerPuuidAndRegionAndQueueType(
            $player->getPuuid(),
            $region,
            $queueType
        );

        if ($existing) {
            $existing->setTier($tier);
            $existing->setRank($rank);
            if ($flush) {
                $this->playerQueueRankRepository->flush();
            }
            return $existing;
        }

        $queueRank = new PlayerQueueRank();
        $queueRank->setPlayer($player);
        $queueRank->setQueueType($queueType);
        $queueRank->setRegion($region);
        $queueRank->setTier($tier);
        $queueRank->setRank($rank);

        return $this->playerQueueRankRepository->add($queueRank, $flush);
    }
}
