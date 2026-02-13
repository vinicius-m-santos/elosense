<?php

namespace App\Repository;

use App\Entity\PlayerMatch;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PlayerMatch>
 */
class PlayerMatchRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlayerMatch::class);
    }

    /**
     * @return PlayerMatch[]
     */
    public function findLastByPuuid(string $puuid, int $limit = 10): array
    {
        return $this->createQueryBuilder('m')
            ->join('m.player', 'p')
            ->where('p.puuid = :puuid')
            ->setParameter('puuid', $puuid)
            ->orderBy('m.id', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function findByMatchIdAndPuuid(string $matchId, string $puuid): ?PlayerMatch
    {
        return $this->createQueryBuilder('m')
            ->join('m.player', 'p')
            ->where('m.matchId = :matchId')
            ->andWhere('p.puuid = :puuid')
            ->setParameter('matchId', $matchId)
            ->setParameter('puuid', $puuid)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function existsByMatchIdAndPuuid(string $matchId, string $puuid): bool
    {
        return $this->createQueryBuilder('m')
            ->select('1')
            ->join('m.player', 'p')
            ->where('m.matchId = :matchId')
            ->andWhere('p.puuid = :puuid')
            ->setParameter('matchId', $matchId)
            ->setParameter('puuid', $puuid)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult() !== null;
    }
}
