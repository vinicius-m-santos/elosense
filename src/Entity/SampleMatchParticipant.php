<?php

namespace App\Entity;

use App\Repository\SampleMatchParticipantRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SampleMatchParticipantRepository::class)]
#[ORM\Table(name: 'sample_match_participant')]
#[ORM\UniqueConstraint(name: 'uniq_sample_participant_match_region_puuid', columns: ['match_id', 'region', 'puuid'])]
class SampleMatchParticipant
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $matchId;

    #[ORM\Column(type: 'string', length: 10)]
    private string $region;

    #[ORM\Column(type: 'string', length: 78)]
    private string $puuid;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $tier = null;

    #[ORM\Column(type: 'string', length: 5, nullable: true)]
    private ?string $rank = null;

    #[ORM\Column(type: 'string', length: 20)]
    private string $teamPosition;

    #[ORM\Column(type: Types::INTEGER)]
    private int $championId;

    #[ORM\Column(type: 'string', length: 100)]
    private string $championName;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $opponentChampionId = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $kills = 0;

    #[ORM\Column(type: Types::INTEGER)]
    private int $deaths = 0;

    #[ORM\Column(type: Types::INTEGER)]
    private int $assists = 0;

    #[ORM\Column(type: Types::FLOAT)]
    private float $csPerMin = 0.0;

    #[ORM\Column(type: Types::FLOAT)]
    private float $damagePerMin = 0.0;

    #[ORM\Column(type: Types::FLOAT)]
    private float $visionScore = 0.0;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $goldPerMin = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $killParticipation = null;

    #[ORM\Column(type: Types::BOOLEAN)]
    private bool $win = false;

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

    public function getPuuid(): string
    {
        return $this->puuid;
    }

    public function setPuuid(string $puuid): static
    {
        $this->puuid = $puuid;
        return $this;
    }

    public function getTier(): ?string
    {
        return $this->tier;
    }

    public function setTier(?string $tier): static
    {
        $this->tier = $tier;
        return $this;
    }

    public function getRank(): ?string
    {
        return $this->rank;
    }

    public function setRank(?string $rank): static
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

    public function getChampionId(): int
    {
        return $this->championId;
    }

    public function setChampionId(int $championId): static
    {
        $this->championId = $championId;
        return $this;
    }

    public function getChampionName(): string
    {
        return $this->championName;
    }

    public function setChampionName(string $championName): static
    {
        $this->championName = $championName;
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

    public function getKills(): int
    {
        return $this->kills;
    }

    public function setKills(int $kills): static
    {
        $this->kills = $kills;
        return $this;
    }

    public function getDeaths(): int
    {
        return $this->deaths;
    }

    public function setDeaths(int $deaths): static
    {
        $this->deaths = $deaths;
        return $this;
    }

    public function getAssists(): int
    {
        return $this->assists;
    }

    public function setAssists(int $assists): static
    {
        $this->assists = $assists;
        return $this;
    }

    public function getCsPerMin(): float
    {
        return $this->csPerMin;
    }

    public function setCsPerMin(float $csPerMin): static
    {
        $this->csPerMin = $csPerMin;
        return $this;
    }

    public function getDamagePerMin(): float
    {
        return $this->damagePerMin;
    }

    public function setDamagePerMin(float $damagePerMin): static
    {
        $this->damagePerMin = $damagePerMin;
        return $this;
    }

    public function getVisionScore(): float
    {
        return $this->visionScore;
    }

    public function setVisionScore(float $visionScore): static
    {
        $this->visionScore = $visionScore;
        return $this;
    }

    public function getGoldPerMin(): ?float
    {
        return $this->goldPerMin;
    }

    public function setGoldPerMin(?float $goldPerMin): static
    {
        $this->goldPerMin = $goldPerMin;
        return $this;
    }

    public function getKillParticipation(): ?float
    {
        return $this->killParticipation;
    }

    public function setKillParticipation(?float $killParticipation): static
    {
        $this->killParticipation = $killParticipation;
        return $this;
    }

    public function isWin(): bool
    {
        return $this->win;
    }

    public function setWin(bool $win): static
    {
        $this->win = $win;
        return $this;
    }
}
