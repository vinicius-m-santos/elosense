<?php

namespace App\Repository;

use App\Entity\Client;
use App\Entity\Personal;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Client>
 */
class ClientRepository extends ServiceEntityRepository
{
    private EntityManagerInterface $em;

    public function __construct(ManagerRegistry $registry, EntityManagerInterface $em)
    {
        parent::__construct($registry, Client::class);

        $this->em = $em;
    }

    public function add(Client $client, bool $flush = true): Client
    {
        $this->em->persist($client);

        if ($flush) {
            $this->em->flush();
        }

        return $client;
    }

    public function delete(Client $client): void
    {
        $this->em->remove($client);
        $this->em->flush();
    }

    public function findAllClientsByUserId(int $userId): mixed
    {
        return $this->createQueryBuilder('c')
            ->select('c')
            ->innerJoin('c.personal', 'p')
            ->where('p.user = :userId')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getResult();
    }

    public function countByPersonal(Personal $personal): int
    {
        return (int) $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->where('c.personal = :personal')
            ->setParameter('personal', $personal)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findWithAnamnese(int $id): ?Client
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.anamnese', 'a')
            ->addSelect('a')
            ->where('c.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    //    /**
    //     * @return Client[] Returns an array of Client objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('p')
    //            ->andWhere('p.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('p.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Client
    //    {
    //        return $this->createQueryBuilder('p')
    //            ->andWhere('p.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
