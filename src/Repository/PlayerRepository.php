<?php

namespace App\Repository;

use App\Entity\Player;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Player>
 */
class PlayerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Player::class);
    }

    public function add(Player $player, bool $flush = true): void
    {
        $this->getEntityManager()->persist($player);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByPuuid(string $puuid): ?Player
    {
        return $this->findOneBy(['puuid' => $puuid]);
    }

    public function findByRiotId(string $gameName, string $tagLine): ?Player
    {
        $gameNameNormalized = mb_strtolower(trim($gameName));
        $tagLineNormalized = mb_strtolower(trim($tagLine));

        return $this->createQueryBuilder('p')
            ->where('LOWER(p.name) = :gameName')
            ->andWhere('LOWER(p.tag) = :tagLine')
            ->setParameter('gameName', $gameNameNormalized)
            ->setParameter('tagLine', $tagLineNormalized)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
