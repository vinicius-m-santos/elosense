<?php

namespace App\Entity;

use App\Repository\PlayerMatchRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PlayerMatchRepository::class)]
#[ORM\Table(name: 'player_match')]
#[ORM\UniqueConstraint(name: 'uniq_player_match_puuid', columns: ['match_id', 'puuid'])]
class PlayerMatch
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $matchId;

    #[ORM\ManyToOne(targetEntity: Player::class, inversedBy: 'matches')]
    #[ORM\JoinColumn(name: 'puuid', referencedColumnName: 'puuid', nullable: false)]
    private Player $player;

    #[ORM\Column(type: 'string', length: 100)]
    private string $champion;

    #[ORM\Column(type: 'integer')]
    private int $championId;

    #[ORM\Column(type: 'boolean')]
    private bool $result;

    #[ORM\Column(type: 'string', length: 50)]
    private string $kda;

    #[ORM\Column(type: 'float')]
    private float $csPerMin;

    #[ORM\Column(type: 'float')]
    private float $damagePerMin;

    #[ORM\Column(type: 'float')]
    private float $visionScore;

    #[ORM\Column(type: 'integer')]
    private int $deaths;

    #[ORM\Column(type: 'integer')]
    private int $earlyDeaths;

    #[ORM\Column(type: 'integer')]
    private int $soloDeaths;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $killParticipation = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $goldPerMin = null;

    #[ORM\Column(type: 'string', length: 5)]
    private string $score;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $gameDuration = null;

    /** Match end time in milliseconds (epoch). For ordering and "time ago" display. */
    #[ORM\Column(type: 'bigint', nullable: true)]
    private ?int $gameEndTimestamp = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $queueId = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $teamPosition = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    private ?int $opponentChampionId = null;

    public function getMatchId(): string
    {
        return $this->matchId;
    }

    public function setMatchId(string $matchId): static
    {
        $this->matchId = $matchId;
        return $this;
    }

    public function getPlayer(): Player
    {
        return $this->player;
    }

    public function setPlayer(Player $player): static
    {
        $this->player = $player;
        return $this;
    }

    public function getChampion(): string
    {
        return $this->champion;
    }

    public function setChampion(string $champion): static
    {
        $this->champion = $champion;
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

    public function getResult(): bool
    {
        return $this->result;
    }

    public function setResult(bool $result): static
    {
        $this->result = $result;
        return $this;
    }

    public function getKda(): string
    {
        return $this->kda;
    }

    public function setKda(string $kda): static
    {
        $this->kda = $kda;
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

    public function getDeaths(): int
    {
        return $this->deaths;
    }

    public function setDeaths(int $deaths): static
    {
        $this->deaths = $deaths;
        return $this;
    }

    public function getEarlyDeaths(): int
    {
        return $this->earlyDeaths;
    }

    public function setEarlyDeaths(int $earlyDeaths): static
    {
        $this->earlyDeaths = $earlyDeaths;
        return $this;
    }

    public function getSoloDeaths(): int
    {
        return $this->soloDeaths;
    }

    public function setSoloDeaths(int $soloDeaths): static
    {
        $this->soloDeaths = $soloDeaths;
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

    public function getGoldPerMin(): ?float
    {
        return $this->goldPerMin;
    }

    public function setGoldPerMin(?float $goldPerMin): static
    {
        $this->goldPerMin = $goldPerMin;
        return $this;
    }

    public function getScore(): string
    {
        return $this->score;
    }

    public function setScore(string $score): static
    {
        $this->score = $score;
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

    public function getGameEndTimestamp(): ?int
    {
        return $this->gameEndTimestamp;
    }

    public function setGameEndTimestamp(?int $gameEndTimestamp): static
    {
        $this->gameEndTimestamp = $gameEndTimestamp;
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

    public function getTeamPosition(): ?string
    {
        return $this->teamPosition;
    }

    public function setTeamPosition(?string $teamPosition): static
    {
        $this->teamPosition = $teamPosition;
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
}
