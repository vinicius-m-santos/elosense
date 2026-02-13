<?php

namespace App\EventListener;

use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationFailureEvent;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class JWTAuthenticationFailureHandler
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    public function onAuthenticationFailure(AuthenticationFailureEvent $event): void
    {
        $errorMessage = 'Credenciais inválidas';

        $request = $event->getRequest();
        $email = $this->extractEmailFromRequest($request);

        if ($email !== null) {
            $user = $this->userRepository->findOneBy(['email' => $email]);
            if ($user === null) {
                $errorMessage = 'Email não encontrado. Cadastre-se em nossa plataforma para criar sua conta.';
            } elseif (!$user->hasPassword()) {
                $errorMessage = 'Esta conta foi criada com Google. Use o botão "Entrar com Google" para acessar.';
            }
        }

        $response = new JsonResponse([
            'success' => false,
            'error' => $errorMessage
        ], 401);

        $event->setResponse($response);
    }

    private function extractEmailFromRequest(Request $request): ?string
    {
        $content = $request->getContent();
        if (empty($content)) {
            return null;
        }

        $data = json_decode($content, true);
        if (!is_array($data)) {
            return null;
        }

        return $data['email'] ?? $data['username'] ?? null;
    }
}
