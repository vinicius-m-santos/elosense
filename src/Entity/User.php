<?php

namespace App\Entity;

use App\Repository\UserRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\HasLifecycleCallbacks]
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: "users")]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer")]
    #[Groups(['user_all', 'client_all'])]
    private int $id;

    #[ORM\Column(type: "uuid", unique: true)]
    private ?Uuid $uuid = null;

    #[ORM\Column(type: "string", unique: true)]
    #[Groups(['user_all', 'client_all', 'anamnese_all', 'client_list'])]
    private string $email;

    #[ORM\Column(type: 'json')]
    #[Groups(['user_all'])]
    private array $roles = [];

    #[ORM\Column(nullable: true)]
    private ?string $password = null;

    #[ORM\Column(length: 255, unique: true, nullable: true)]
    private ?string $googleId = null;

    #[ORM\Column]
    #[Groups(['user_all', 'client_all'])]
    private string $firstName;

    #[ORM\Column]
    #[Groups(['user_all', 'client_all'])]
    private string $lastName;

    #[ORM\Column(type: "datetime_immutable")]
    #[Groups(['user_all', 'client_all', 'personal_all'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: "datetime_immutable", nullable: true)]
    #[Groups(['user_all'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user_all', 'client_all', 'anamnese_all', 'client_list'])]
    private ?string $avatarKey = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['user_all', 'client_all', 'anamnese_all', 'client_list'])]
    private ?string $avatarUrl = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['user_all', 'client_all', 'anamnese_all', 'client_list'])]
    private ?string $phone = null;

    #[ORM\Column(type: "date_immutable", nullable: true)]
    #[Groups(['user_all', 'client_all', 'anamnese_all', 'client_list'])]
    private ?\DateTimeImmutable $birthDate = null;

    #[ORM\Column(length: 1, nullable: true)]
    #[Groups(['user_all', 'client_all', 'anamnese_all', 'client_list'])]
    private ?string $gender = null;

    #[ORM\Column(type: "boolean", options: ["default" => true])]
    #[Groups(['user_all', 'client_all', 'anamnese_all', 'client_list'])]
    private bool $active = true;

    #[ORM\Column(type: "datetime_immutable", nullable: true)]
    private ?\DateTimeImmutable $deletedAt = null;

    #[ORM\Column(type: "boolean", options: ["default" => true])]
    #[Groups(['user_all'])]
    private bool $emailNotifications = true;

    #[ORM\Column(type: "boolean", options: ["default" => true])]
    #[Groups(['user_all'])]
    private bool $appNotifications = true;

    #[ORM\Column(type: "boolean", options: ["default" => false])]
    #[Groups(['user_all'])]
    private bool $isVerified = false;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $verificationToken = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $resetToken = null;

    #[ORM\Column(type: "datetime_immutable", nullable: true)]
    private ?\DateTimeImmutable $resetTokenExpiresAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PrePersist]
    public function initializeUuid(): void
    {
        if ($this->uuid === null) {
            $this->uuid = Uuid::v4();
        }
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function setFirstName(string $firstName): void
    {
        $this->firstName = $firstName;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setLastName(string $lastName): void
    {
        $this->lastName = $lastName;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setPassword(?string $password): void
    {
        $this->password = $password;
    }

    public function getPassword(): string
    {
        return $this->password ?? '';
    }

    public function hasPassword(): bool
    {
        return $this->password !== null && $this->password !== '';
    }

    public function getGoogleId(): ?string
    {
        return $this->googleId;
    }

    public function setGoogleId(?string $googleId): void
    {
        $this->googleId = $googleId;
    }

    public function getUuid(): string
    {
        return $this->uuid;
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }
    public function getRoles(): array
    {
        return array_unique(array_merge($this->roles, ['ROLE_USER']));
    }
    public function setRoles(array $roles): self
    {
        $this->roles = $roles;
        return $this;
    }
    public function eraseCredentials(): void {}

    public function setAvatarKey(?string $avatarKey): self
    {
        $this->avatarKey = $avatarKey;
        return $this;
    }

    public function getAvatarKey(): string|null
    {
        return $this->avatarKey;
    }

    public function setAvatarUrl(?string $avatarUrl): self
    {
        $this->avatarUrl = $avatarUrl;
        return $this;
    }

    public function getAvatarUrl(): string|null
    {
        return $this->avatarUrl;
    }

    public function setPhone(?string $phone): self
    {
        $this->phone = $phone;
        return $this;
    }

    public function getPhone(): string|null
    {
        return $this->phone;
    }

    public function setBirthDate(?\DateTimeImmutable $birthDate): self
    {
        $this->birthDate = $birthDate;
        return $this;
    }

    public function getBirthDate(): ?\DateTimeImmutable
    {
        return $this->birthDate;
    }

    #[Groups(['user_all', 'client_all', 'anamnese_all', 'client_list'])]
    public function getAge(): ?int
    {
        if ($this->birthDate === null) {
            return null;
        }
        return $this->birthDate->diff(new \DateTimeImmutable())->y;
    }

    public function setGender(?string $gender): self
    {
        $this->gender = $gender;
        return $this;
    }

    public function getGender(): ?string
    {
        return $this->gender;
    }

    public function setActive(bool $active): self
    {
        $this->active = $active;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getDeletedAt(): ?\DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?\DateTimeImmutable $deletedAt): self
    {
        $this->deletedAt = $deletedAt;
        return $this;
    }

    public function isEmailNotifications(): bool
    {
        return $this->emailNotifications;
    }

    public function setEmailNotifications(bool $emailNotifications): self
    {
        $this->emailNotifications = $emailNotifications;
        return $this;
    }

    public function isAppNotifications(): bool
    {
        return $this->appNotifications;
    }

    public function setAppNotifications(bool $appNotifications): self
    {
        $this->appNotifications = $appNotifications;
        return $this;
    }

    public function isVerified(): bool
    {
        return $this->isVerified;
    }

    public function setIsVerified(bool $isVerified): self
    {
        $this->isVerified = $isVerified;
        return $this;
    }

    public function getVerificationToken(): ?string
    {
        return $this->verificationToken;
    }

    public function setVerificationToken(?string $verificationToken): self
    {
        $this->verificationToken = $verificationToken;
        return $this;
    }

    public function getResetToken(): ?string
    {
        return $this->resetToken;
    }

    public function setResetToken(?string $resetToken): self
    {
        $this->resetToken = $resetToken;
        return $this;
    }

    public function getResetTokenExpiresAt(): ?\DateTimeImmutable
    {
        return $this->resetTokenExpiresAt;
    }

    public function setResetTokenExpiresAt(?\DateTimeImmutable $resetTokenExpiresAt): self
    {
        $this->resetTokenExpiresAt = $resetTokenExpiresAt;
        return $this;
    }
}
