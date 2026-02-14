<?php

namespace App\Repository;

use App\Entity\SamplePlayer;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SamplePlayer>
 */
class SamplePlayerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SamplePlayer::class);
    }

    public function findByPuuidAndRegion(string $puuid, string $region): ?SamplePlayer
    {
        return $this->findOneBy(['puuid' => $puuid, 'region' => $region]);
    }

    public function upsert(string $puuid, string $region, string $tier, string $rank, string $queueType): SamplePlayer
    {
        $player = $this->findByPuuidAndRegion($puuid, $region);
        if (!$player) {
            $player = new SamplePlayer();
            $player->setPuuid($puuid);
            $player->setRegion($region);
            $this->getEntityManager()->persist($player);
        }
        $player->setTier($tier);
        $player->setRank($rank);
        $player->setQueueType($queueType);
        $player->setUpdatedAt(new \DateTimeImmutable());
        return $player;
    }
}
