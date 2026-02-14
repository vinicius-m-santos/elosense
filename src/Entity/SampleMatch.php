<?php

namespace App\Entity;

use App\Repository\SampleMatchRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SampleMatchRepository::class)]
#[ORM\Table(name: 'sample_match')]
#[ORM\UniqueConstraint(name: 'uniq_sample_match_id_region', columns: ['match_id', 'region'])]
class SampleMatch
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $matchId;

    #[ORM\Column(type: 'string', length: 10)]
    private string $region;

    #[ORM\Column(type: Types::JSON)]
    private array $payload = [];

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?string $gameCreation = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $gameDuration = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $queueId = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMatchId(): string
    {
        return $this->matchId;
    }

    public function setMatchId(string $matchId): static
    {
        $this->matchId = $matchId;
        return $this;
    }

    public function getRegion(): string
    {
        return $this->region;
    }

    public function setRegion(string $region): static
    {
        $this->region = $region;
        return $this;
    }

    public function getPayload(): array
    {
        return $this->payload;
    }

    public function setPayload(array $payload): static
    {
        $this->payload = $payload;
        return $this;
    }

    public function getGameCreation(): ?string
    {
        return $this->gameCreation;
    }

    public function setGameCreation(?string $gameCreation): static
    {
        $this->gameCreation = $gameCreation;
        return $this;
    }

    public function getGameDuration(): ?int
    {
        return $this->gameDuration;
    }

    public function setGameDuration(?int $gameDuration): static
    {
        $this->gameDuration = $gameDuration;
        return $this;
    }

    public function getQueueId(): ?int
    {
        return $this->queueId;
    }

    public function setQueueId(?int $queueId): static
    {
        $this->queueId = $queueId;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
