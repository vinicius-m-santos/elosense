<?php

namespace App\Entity;

use App\Repository\PlanRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: PlanRepository::class)]
#[ORM\Table(name: "plan")]
class Plan
{
    public const CODE_FREE = 'free';
    public const CODE_PRO = 'pro';
    public const CODE_LIFETIME = 'lifetime';

    /** @var array<string, int|null> ex: ['max_students' => 3] ou ['max_students' => null] para ilimitado */
    public const CAPABILITY_MAX_STUDENTS = 'max_students';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer")]
    #[Groups(['plan_all', 'subscription_all'])]
    private int $id;

    #[ORM\Column(length: 50, unique: true)]
    #[Groups(['plan_all', 'subscription_all'])]
    private string $code = '';

    #[ORM\Column(length: 100)]
    #[Groups(['plan_all', 'subscription_all'])]
    private string $name = '';

    /** @var array<string, int|null> capabilities: limit value or null for unlimited */
    #[ORM\Column(type: "json")]
    #[Groups(['plan_all', 'subscription_all'])]
    private array $capabilities = [];

    public function getId(): int
    {
        return $this->id;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;
        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    /** @return array<string, int|null> */
    public function getCapabilities(): array
    {
        return $this->capabilities;
    }

    /** @param array<string, int|null> $capabilities */
    public function setCapabilities(array $capabilities): self
    {
        $this->capabilities = $capabilities;
        return $this;
    }

    /** Retorna o limite da capability (null = ilimitado). */
    public function getCapabilityLimit(string $capability): ?int
    {
        return $this->capabilities[$capability] ?? null;
    }
}
