<?php

namespace App\Repository;

use App\Entity\SampleMatchParticipant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SampleMatchParticipant>
 */
class SampleMatchParticipantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SampleMatchParticipant::class);
    }

    /**
     * Return map of puuid => true for participants already stored for this match/region.
     * Used to avoid N findOneBy calls when persisting participants.
     *
     * @return array<string, true>
     */
    public function findExistingPuuidsByMatchAndRegion(string $matchId, string $region): array
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p.puuid')
            ->where('p.matchId = :matchId')
            ->andWhere('p.region = :region')
            ->setParameter('matchId', $matchId)
            ->setParameter('region', $region);
        $rows = $qb->getQuery()->getResult();
        $puuids = array_column($rows, 'puuid');
        return array_fill_keys($puuids, true);
    }
}
