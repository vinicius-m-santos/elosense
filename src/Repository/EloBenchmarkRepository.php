<?php

namespace App\Repository;

use App\Entity\EloBenchmark;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EloBenchmark>
 */
class EloBenchmarkRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EloBenchmark::class);
    }

    public function findOneByKeys(
        string $region,
        int $queueId,
        string $tier,
        string $rank,
        string $teamPosition,
        ?int $championId,
        ?int $opponentChampionId
    ): ?EloBenchmark {
        $qb = $this->createQueryBuilder('b')
            ->where('b.region = :region')
            ->andWhere('b.queueId = :queueId')
            ->andWhere('b.tier = :tier')
            ->andWhere('b.rank = :rank')
            ->andWhere('b.teamPosition = :teamPosition')
            ->setParameter('region', $region)
            ->setParameter('queueId', $queueId)
            ->setParameter('tier', $tier)
            ->setParameter('rank', $rank)
            ->setParameter('teamPosition', $teamPosition);
        if ($championId === null) {
            $qb->andWhere('b.championId IS NULL');
        } else {
            $qb->andWhere('b.championId = :championId')->setParameter('championId', $championId);
        }
        if ($opponentChampionId === null) {
            $qb->andWhere('b.opponentChampionId IS NULL');
        } else {
            $qb->andWhere('b.opponentChampionId = :opponentChampionId')->setParameter('opponentChampionId', $opponentChampionId);
        }
        $qb->setMaxResults(1);
        return $qb->getQuery()->getOneOrNullResult();
    }
}
