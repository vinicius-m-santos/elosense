<?php

namespace App\Repository;

use App\Entity\SampleMatch;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SampleMatch>
 */
class SampleMatchRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SampleMatch::class);
    }

    public function existsByMatchIdAndRegion(string $matchId, string $region): bool
    {
        return $this->createQueryBuilder('m')
            ->select('1')
            ->where('m.matchId = :matchId')
            ->andWhere('m.region = :region')
            ->setParameter('matchId', $matchId)
            ->setParameter('region', $region)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult() !== null;
    }

    public function findByMatchIdAndRegion(string $matchId, string $region): ?SampleMatch
    {
        return $this->findOneBy(['matchId' => $matchId, 'region' => $region]);
    }
}
