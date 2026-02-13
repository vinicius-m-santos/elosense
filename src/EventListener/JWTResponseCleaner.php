<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class JWTResponseCleaner implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => ['onKernelResponse', 10],
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        $request = $event->getRequest();
        $response = $event->getResponse();

        // Apenas processar respostas do endpoint de login
        if ($request->getPathInfo() !== '/api/login_check' || !$response instanceof JsonResponse) {
            return;
        }

        $data = json_decode($response->getContent(), true);
        
        if (!is_array($data)) {
            return;
        }

        // Se houver erro (success: false), remover tokens
        if (isset($data['success']) && $data['success'] === false) {
            unset($data['token']);
            unset($data['refresh_token']);
            $response->setData($data);
        }
    }

    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $data = $event->getData();
        
        // Se houver erro (success: false), remover tokens
        if (isset($data['success']) && $data['success'] === false) {
            unset($data['token']);
            unset($data['refresh_token']);
            $event->setData($data);
        }
    }
}
