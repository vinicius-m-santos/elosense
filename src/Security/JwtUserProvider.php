<?php

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;

class JwtUserProvider implements UserProviderInterface
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    /**
     * Used by LexikJWT to load the user when decoding the token
     */
    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        // Customize how user is fetched (email, id, etc)
        $user = $this->userRepository->findOneBy(['email' => $identifier]);

        if (!$user) {
            throw new UserNotFoundException(sprintf('User "%s" not found.', $identifier));
        }

        // Optional: modify or enrich user data here
        // e.g. attach custom roles or flags
        // $user->setRoles([...]);
        // $user->setIsActive(true);

        return $user;
    }

    /**
     * Required by the interface — not used by JWT (stateless)
     */
    public function refreshUser(UserInterface $user): UserInterface
    {
        return $user;
    }

    public function supportsClass(string $class): bool
    {
        return $class === User::class;
    }
}
