<?php

namespace App\Repository;

use App\Entity\PlayerQueueRank;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PlayerQueueRank>
 */
class PlayerQueueRankRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlayerQueueRank::class);
    }

    public function add(PlayerQueueRank $playerQueueRank, bool $flush = true): PlayerQueueRank
    {
        $this->getEntityManager()->persist($playerQueueRank);
        if ($flush) {
            $this->flush();
        }

        return $playerQueueRank;
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function findOneByPlayerPuuidAndRegionAndQueueType(string $puuid, string $region, string $queueType): ?PlayerQueueRank
    {
        return $this->createQueryBuilder('pqr')
            ->innerJoin('pqr.player', 'p')
            ->andWhere('p.puuid = :puuid')
            ->andWhere('pqr.region = :region')
            ->andWhere('pqr.queueType = :queueType')
            ->setParameter('puuid', $puuid)
            ->setParameter('region', $region)
            ->setParameter('queueType', $queueType)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
