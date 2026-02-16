<?php

namespace App\Entity;

use App\Repository\PlayerRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\DBAL\Types\Types;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: PlayerRepository::class)]
#[ORM\Table(name: 'players')]
class Player
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 78, unique: true)]
    #[Groups(['player_all'])]
    private string $puuid;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['player_all'])]
    private string $name;

    #[ORM\Column(type: 'string', length: 20)]
    #[Groups(['player_all'])]
    private string $tag;

    #[ORM\OneToMany(targetEntity: PlayerMatch::class, mappedBy: 'player', orphanRemoval: true)]
    #[Groups(['player_all'])]
    private Collection $matches;

    #[ORM\OneToMany(targetEntity: PlayerQueueRank::class, mappedBy: 'player', orphanRemoval: true, cascade: ['persist'])]
    #[Groups(['player_all'])]
    private Collection $queueRanks;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['player_all'])]
    private ?int $profileIconId = null;

    public function __construct()
    {
        $this->matches = new ArrayCollection();
        $this->queueRanks = new ArrayCollection();
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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getTag(): string
    {
        return $this->tag;
    }

    public function setTag(string $tag): static
    {
        $this->tag = $tag;
        return $this;
    }

    /**
     * @return Collection<int, PlayerMatch>
     */
    public function getMatches(): Collection
    {
        return $this->matches;
    }

    /**
     * @return Collection<int, PlayerQueueRank>
     */
    public function getQueueRanks(): Collection
    {
        return $this->queueRanks;
    }

    public function addQueueRank(PlayerQueueRank $queueRank): static
    {
        if (!$this->queueRanks->contains($queueRank)) {
            $this->queueRanks->add($queueRank);
            $queueRank->setPlayer($this);
        }
        return $this;
    }

    public function removeQueueRank(PlayerQueueRank $queueRank): static
    {
        $this->queueRanks->removeElement($queueRank);
        return $this;
    }

    public function getProfileIconId(): ?int
    {
        return $this->profileIconId;
    }

    public function setProfileIconId(?int $profileIconId): static
    {
        $this->profileIconId = $profileIconId;
        return $this;
    }
}
