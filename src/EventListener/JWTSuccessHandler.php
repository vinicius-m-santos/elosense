<?php
// src/EventListener/JWTSuccessHandler.php
namespace App\EventListener;

use App\Entity\User;
use App\Exception\EmailNotVerifiedException;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class JWTSuccessHandler
{
    private NormalizerInterface $normalizer;

    public function __construct(NormalizerInterface $normalizer)
    {
        $this->normalizer = $normalizer;
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
            'avatarUrl' => $user->getAvatarUrl(),
        ];

        if ($user->getClient()) {
            $data['user']['client'] = [
                'id' => $user->getClient()->getId(),
                'name' => $user->getClient()->getName(),
            ];
        }

        if ($user->getPersonal()) {
            $data['user']['personal'] = [
                'id' => $user->getPersonal()->getId(),
                'showPlatformExercises' => $user->getPersonal()->isShowPlatformExercises(),
            ];
        }

        $data['success'] = true;

        $event->setData($data);
    }
}
