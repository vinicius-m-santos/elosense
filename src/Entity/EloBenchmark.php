<?php

namespace App\Entity;

use App\Repository\EloBenchmarkRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EloBenchmarkRepository::class)]
#[ORM\Table(name: 'elo_benchmark')]
#[ORM\Index(name: 'idx_elo_benchmark_lookup', columns: ['region', 'queue_id', 'tier', 'rank', 'team_position', 'champion_id', 'opponent_champion_id'])]
class EloBenchmark
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 10)]
    private string $region;

    #[ORM\Column(type: Types::INTEGER)]
    private int $queueId;

    #[ORM\Column(type: 'string', length: 20)]
    private string $tier;

    #[ORM\Column(type: 'string', length: 5)]
    private string $rank;

    #[ORM\Column(type: 'string', length: 20)]
    private string $teamPosition;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $championId = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $opponentChampionId = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $sampleSize = 0;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $csPerMinAvg = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $csPerMinP50 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $csPerMinP75 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $damagePerMinAvg = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $damagePerMinP50 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $damagePerMinP75 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $visionScoreAvg = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $visionScoreP50 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $visionScoreP75 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $goldPerMinAvg = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $goldPerMinP50 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $goldPerMinP75 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $killParticipationAvg = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $killParticipationP50 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $killParticipationP75 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $deathsAvg = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $deathsP50 = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $deathsP75 = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getQueueId(): int
    {
        return $this->queueId;
    }

    public function setQueueId(int $queueId): static
    {
        $this->queueId = $queueId;
        return $this;
    }

    public function getTier(): string
    {
        return $this->tier;
    }

    public function setTier(string $tier): static
    {
        $this->tier = $tier;
        return $this;
    }

    public function getRank(): string
    {
        return $this->rank;
    }

    public function setRank(string $rank): static
    {
        $this->rank = $rank;
        return $this;
    }

    public function getTeamPosition(): string
    {
        return $this->teamPosition;
    }

    public function setTeamPosition(string $teamPosition): static
    {
        $this->teamPosition = $teamPosition;
        return $this;
    }

    public function getChampionId(): ?int
    {
        return $this->championId;
    }

    public function setChampionId(?int $championId): static
    {
        $this->championId = $championId;
        return $this;
    }

    public function getOpponentChampionId(): ?int
    {
        return $this->opponentChampionId;
    }

    public function setOpponentChampionId(?int $opponentChampionId): static
    {
        $this->opponentChampionId = $opponentChampionId;
        return $this;
    }

    public function getSampleSize(): int
    {
        return $this->sampleSize;
    }

    public function setSampleSize(int $sampleSize): static
    {
        $this->sampleSize = $sampleSize;
        return $this;
    }

    public function getCsPerMinAvg(): ?float
    {
        return $this->csPerMinAvg;
    }

    public function setCsPerMinAvg(?float $csPerMinAvg): static
    {
        $this->csPerMinAvg = $csPerMinAvg;
        return $this;
    }

    public function getCsPerMinP50(): ?float
    {
        return $this->csPerMinP50;
    }

    public function setCsPerMinP50(?float $csPerMinP50): static
    {
        $this->csPerMinP50 = $csPerMinP50;
        return $this;
    }

    public function getCsPerMinP75(): ?float
    {
        return $this->csPerMinP75;
    }

    public function setCsPerMinP75(?float $csPerMinP75): static
    {
        $this->csPerMinP75 = $csPerMinP75;
        return $this;
    }

    public function getDamagePerMinAvg(): ?float
    {
        return $this->damagePerMinAvg;
    }

    public function setDamagePerMinAvg(?float $damagePerMinAvg): static
    {
        $this->damagePerMinAvg = $damagePerMinAvg;
        return $this;
    }

    public function getDamagePerMinP50(): ?float
    {
        return $this->damagePerMinP50;
    }

    public function setDamagePerMinP50(?float $damagePerMinP50): static
    {
        $this->damagePerMinP50 = $damagePerMinP50;
        return $this;
    }

    public function getDamagePerMinP75(): ?float
    {
        return $this->damagePerMinP75;
    }

    public function setDamagePerMinP75(?float $damagePerMinP75): static
    {
        $this->damagePerMinP75 = $damagePerMinP75;
        return $this;
    }

    public function getVisionScoreAvg(): ?float
    {
        return $this->visionScoreAvg;
    }

    public function setVisionScoreAvg(?float $visionScoreAvg): static
    {
        $this->visionScoreAvg = $visionScoreAvg;
        return $this;
    }

    public function getVisionScoreP50(): ?float
    {
        return $this->visionScoreP50;
    }

    public function setVisionScoreP50(?float $visionScoreP50): static
    {
        $this->visionScoreP50 = $visionScoreP50;
        return $this;
    }

    public function getVisionScoreP75(): ?float
    {
        return $this->visionScoreP75;
    }

    public function setVisionScoreP75(?float $visionScoreP75): static
    {
        $this->visionScoreP75 = $visionScoreP75;
        return $this;
    }

    public function getGoldPerMinAvg(): ?float
    {
        return $this->goldPerMinAvg;
    }

    public function setGoldPerMinAvg(?float $goldPerMinAvg): static
    {
        $this->goldPerMinAvg = $goldPerMinAvg;
        return $this;
    }

    public function getGoldPerMinP50(): ?float
    {
        return $this->goldPerMinP50;
    }

    public function setGoldPerMinP50(?float $goldPerMinP50): static
    {
        $this->goldPerMinP50 = $goldPerMinP50;
        return $this;
    }

    public function getGoldPerMinP75(): ?float
    {
        return $this->goldPerMinP75;
    }

    public function setGoldPerMinP75(?float $goldPerMinP75): static
    {
        $this->goldPerMinP75 = $goldPerMinP75;
        return $this;
    }

    public function getKillParticipationAvg(): ?float
    {
        return $this->killParticipationAvg;
    }

    public function setKillParticipationAvg(?float $killParticipationAvg): static
    {
        $this->killParticipationAvg = $killParticipationAvg;
        return $this;
    }

    public function getKillParticipationP50(): ?float
    {
        return $this->killParticipationP50;
    }

    public function setKillParticipationP50(?float $killParticipationP50): static
    {
        $this->killParticipationP50 = $killParticipationP50;
        return $this;
    }

    public function getKillParticipationP75(): ?float
    {
        return $this->killParticipationP75;
    }

    public function setKillParticipationP75(?float $killParticipationP75): static
    {
        $this->killParticipationP75 = $killParticipationP75;
        return $this;
    }

    public function getDeathsAvg(): ?float
    {
        return $this->deathsAvg;
    }

    public function setDeathsAvg(?float $deathsAvg): static
    {
        $this->deathsAvg = $deathsAvg;
        return $this;
    }

    public function getDeathsP50(): ?float
    {
        return $this->deathsP50;
    }

    public function setDeathsP50(?float $deathsP50): static
    {
        $this->deathsP50 = $deathsP50;
        return $this;
    }

    public function getDeathsP75(): ?float
    {
        return $this->deathsP75;
    }

    public function setDeathsP75(?float $deathsP75): static
    {
        $this->deathsP75 = $deathsP75;
        return $this;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
}
