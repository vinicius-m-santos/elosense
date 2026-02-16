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

    /**
     * Find (match_id, region) pairs that have fewer than 10 participants.
     * Used by backfill command to complete participants without calling match API.
     *
     * @return list<array{match_id: string, region: string}>
     */
    public function findMatchIdsAndRegionsWithFewerThanTenParticipants(?string $region = null, int $limit = 0): array
    {
        $sql = <<<'SQL'
            SELECT m.match_id, m.region
            FROM sample_match m
            WHERE (SELECT COUNT(*) FROM sample_match_participant p WHERE p.match_id = m.match_id AND p.region = m.region) < 10
            SQL;
        $params = [];
        $types = [];
        if ($region !== null && $region !== '') {
            $sql .= ' AND m.region = :region';
            $params['region'] = $region;
            $types['region'] = \PDO::PARAM_STR;
        }
        $sql .= ' ORDER BY m.id';
        if ($limit > 0) {
            $sql .= ' LIMIT :limit';
            $params['limit'] = $limit;
            $types['limit'] = \PDO::PARAM_INT;
        }
        $stmt = $this->getEntityManager()->getConnection()->executeQuery($sql, $params, $types);
        $rows = [];
        while (($row = $stmt->fetchAssociative()) !== false) {
            $rows[] = ['match_id' => (string) $row['match_id'], 'region' => (string) $row['region']];
        }
        return $rows;
    }
}
