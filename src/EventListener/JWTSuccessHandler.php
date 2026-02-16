<?php
// src/EventListener/JWTSuccessHandler.php
namespace App\EventListener;

use App\Entity\User;
use App\Service\S3Service;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;

class JWTSuccessHandler
{
    public function __construct(
        private readonly S3Service $s3Service
    ) {
    }
    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event)
    {
        $data = $event->getData();
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        if ($user->getDeletedAt() !== null) {
            $event->setData([
                'success' => false,
                'error' => 'Conta excluída',
                'message' => 'Esta conta foi excluída e não pode mais fazer login.'
            ]);
            return;
        }

        if (!$user->isVerified()) {
            $event->setData([
                'success' => false,
                'requiresVerification' => true,
                'error' => 'Conta não verificada',
                'message' => 'Por favor, verifique seu email antes de fazer login.'
            ]);
            return;
        }

        $data['user'] = [
            'id' => $user->getId(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'email' => $user->getUserIdentifier(),
            'roles' => $user->getRoles(),
            'uuid' => $user->getUuid(),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            'phone' => $user->getPhone(),
            'emailNotifications' => $user->isEmailNotifications(),
            'appNotifications' => $user->isAppNotifications(),
            'birthDate' => $user->getBirthDate() ? $user->getBirthDate()->format('Y-m-d') : null,
            'isVerified' => $user->isVerified(),
            'gender' => $user->getGender(),
            'active' => $user->isActive(),
            'deletedAt' => $user->getDeletedAt() ? $user->getDeletedAt()->format('Y-m-d H:i:s') : null,
            'avatarKey' => $user->getAvatarKey(),
            'avatarUrl' => $this->resolveAvatarUrl($user),
        ];

        $data['success'] = true;

        $event->setData($data);
    }

    private function resolveAvatarUrl(User $user): ?string
    {
        $key = $user->getAvatarKey();
        if (!empty($key)) {
            return $this->s3Service->generateFileUrl($key);
        }
        return $user->getAvatarUrl();
    }
}
