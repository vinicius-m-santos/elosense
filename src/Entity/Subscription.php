<?php

namespace App\Entity;

use App\Repository\SubscriptionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: SubscriptionRepository::class)]
#[ORM\Table(name: "subscription")]
class Subscription
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_CANCELLED = 'cancelled';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer")]
    #[Groups(['subscription_all'])]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Plan::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['subscription_all'])]
    private Plan $plan;

    #[ORM\Column(length: 20)]
    #[Groups(['subscription_all'])]
    private string $status = self::STATUS_ACTIVE;

    #[ORM\Column(type: "datetime_immutable")]
    #[Groups(['subscription_all'])]
    private \DateTimeImmutable $startedAt;

    #[ORM\Column(type: "datetime_immutable", nullable: true)]
    #[Groups(['subscription_all'])]
    private ?\DateTimeImmutable $endsAt = null;

    public function __construct()
    {
        $this->startedAt = new \DateTimeImmutable();
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getPlan(): Plan
    {
        return $this->plan;
    }

    public function setPlan(Plan $plan): self
    {
        $this->plan = $plan;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getStartedAt(): \DateTimeImmutable
    {
        return $this->startedAt;
    }

    public function setStartedAt(\DateTimeImmutable $startedAt): self
    {
        $this->startedAt = $startedAt;
        return $this;
    }

    public function getEndsAt(): ?\DateTimeImmutable
    {
        return $this->endsAt;
    }

    public function setEndsAt(?\DateTimeImmutable $endsAt): self
    {
        $this->endsAt = $endsAt;
        return $this;
    }

    public function isLifetime(): bool
    {
        return $this->endsAt === null;
    }
}
