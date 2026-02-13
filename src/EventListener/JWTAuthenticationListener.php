<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTAuthenticatedEvent;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class JWTAuthenticationListener
{
    public function onJWTAuthenticated(JWTAuthenticatedEvent $event): void
    {
        $user = $event->getToken()->getUser();

        if (!$user instanceof User) {
            return;
        }

        // Verificar se a conta está verificada
        if (!$user->isVerified()) {
            throw new UnauthorizedHttpException('Bearer', 'Conta não verificada. Por favor, verifique seu email antes de fazer login.');
        }
    }
}
