<?php

namespace App\Entity;

use App\Repository\PlayerQueueRankRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: PlayerQueueRankRepository::class)]
#[ORM\Table(name: 'player_queue_ranks')]
class PlayerQueueRank
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 10)]
    #[Groups(['player_all'])]
    private string $region;

    #[ORM\Column(type: 'string', length: 20)]
    #[Groups(['player_all'])]
    private string $tier;

    #[ORM\Column(type: 'string', length: 5)]
    #[Groups(['player_all'])]
    private string $rank;

    #[ORM\Column(type: 'string', length: 30)]
    #[Groups(['player_all'])]
    private string $queueType;

    #[ORM\ManyToOne(targetEntity: Player::class, inversedBy: 'queueRanks')]
    #[ORM\JoinColumn(name: 'player_puuid', referencedColumnName: 'puuid', nullable: false, onDelete: 'CASCADE')]
    private Player $player;

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

    public function getQueueType(): string
    {
        return $this->queueType;
    }

    public function setQueueType(string $queueType): static
    {
        $this->queueType = $queueType;
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
}
