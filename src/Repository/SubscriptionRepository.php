<?php

namespace App\Repository;

use App\Entity\Personal;
use App\Entity\Subscription;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Subscription>
 */
class SubscriptionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry, private readonly EntityManagerInterface $em)
    {
        parent::__construct($registry, Subscription::class);
    }

    public function findActiveByPersonal(Personal $personal): ?Subscription
    {
        return $this->createQueryBuilder('s')
            ->where('s.personal = :personal')
            ->andWhere('s.status = :status')
            ->setParameter('personal', $personal)
            ->setParameter('status', Subscription::STATUS_ACTIVE)
            ->orderBy('s.startedAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function add(Subscription $subscription, bool $flush = true): Subscription
    {
        $this->em->persist($subscription);
        if ($flush) {
            $this->em->flush();
        }
        return $subscription;
    }
}
