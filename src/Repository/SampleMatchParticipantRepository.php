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

    /**
     * Distinct (puuid, region, queueId) for participants with missing tier/rank in ranked matches.
     * Used by backfill command to know which league API calls to make.
     *
     * @return list<array{puuid: string, region: string, queueId: int}>
     */
    public function findDistinctPuuidsWithMissingTierRank(?string $region, int $limit): array
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p.puuid', 'p.region', 'm.queueId')
            ->innerJoin(\App\Entity\SampleMatch::class, 'm', 'WITH', 'p.matchId = m.matchId AND p.region = m.region')
            ->where('p.tier IS NULL OR p.rank IS NULL')
            ->andWhere('m.queueId IN (:queues)')
            ->setParameter('queues', [420, 440]);
        if ($region !== null && $region !== '') {
            $qb->andWhere('p.region = :region')->setParameter('region', $region);
        }
        $qb->groupBy('p.puuid')->addGroupBy('p.region')->addGroupBy('m.queueId');
        if ($limit > 0) {
            $qb->setMaxResults($limit);
        }
        $rows = $qb->getQuery()->getArrayResult();
        $out = [];
        foreach ($rows as $row) {
            $out[] = [
                'puuid' => (string) $row['puuid'],
                'region' => (string) $row['region'],
                'queueId' => (int) $row['queueId'],
            ];
        }
        return $out;
    }

    /**
     * Participant IDs with given puuid, region and match queue_id, and missing tier/rank.
     *
     * @return list<int>
     */
    public function findIdsWithMissingTierRankByPuuidRegionAndQueue(string $puuid, string $region, int $queueId): array
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p.id')
            ->innerJoin(\App\Entity\SampleMatch::class, 'm', 'WITH', 'p.matchId = m.matchId AND p.region = m.region')
            ->where('p.puuid = :puuid')
            ->andWhere('p.region = :region')
            ->andWhere('m.queueId = :queueId')
            ->andWhere('p.tier IS NULL OR p.rank IS NULL')
            ->setParameter('puuid', $puuid)
            ->setParameter('region', $region)
            ->setParameter('queueId', $queueId);
        $rows = $qb->getQuery()->getArrayResult();
        $ids = [];
        foreach ($rows as $row) {
            $ids[] = (int) $row['id'];
        }
        return $ids;
    }

    /**
     * Update tier/rank for participants by IDs (used after backfill resolve).
     *
     * @param list<int> $ids
     */
    public function updateTierRankByIds(array $ids, ?string $tier, ?string $rank): void
    {
        if ($ids === []) {
            return;
        }
        $this->getEntityManager()->createQueryBuilder()
            ->update(SampleMatchParticipant::class, 'p')
            ->set('p.tier', ':tier')
            ->set('p.rank', ':rank')
            ->where('p.id IN (:ids)')
            ->setParameter('tier', $tier)
            ->setParameter('rank', $rank)
            ->setParameter('ids', $ids)
            ->getQuery()
            ->execute();
    }
}
