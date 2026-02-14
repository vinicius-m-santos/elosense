<?php

namespace App\Controller;

use App\Entity\Plan;
use App\Repository\PersonalRepository;
use App\Service\SubscriptionService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/subscription')]
class SubscriptionController extends AbstractController
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService
    ) {}

    #[Route('/me', name: 'subscription_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            throw new UnprocessableEntityHttpException('Usuário não encontrado');
        }

        // $personal = $this->personalRepository->findOneBy(['user' => $user]);
        // if (!$personal) {
        //     throw new UnprocessableEntityHttpException('Personal trainer não encontrado');
        // }

        try {
            // $subscription = $this->subscriptionService->ensureActiveSubscription($personal);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'message' => 'Erro ao carregar assinatura. Execute as migrations do banco (plan/subscription).',
                'error' => $e->getMessage(),
            ], 503);
        }

        // $plan = $subscription->getPlan();
        // $maxStudentsLimit = $this->subscriptionService->getCapabilityLimit($personal, Plan::CAPABILITY_MAX_STUDENTS);
        // $studentsUsed = $this->subscriptionService->getCapabilityUsage($personal, Plan::CAPABILITY_MAX_STUDENTS);

        // $data = [
        //     'plan' => [
        //         'id' => $plan->getId(),
        //         'code' => $plan->getCode(),
        //         'name' => $plan->getName(),
        //         'capabilities' => $plan->getCapabilities(),
        //     ],
        //     'subscription' => [
        //         'status' => $subscription->getStatus(),
        //         'started_at' => $subscription->getStartedAt()->format(\DateTimeInterface::ATOM),
        //         'ends_at' => $subscription->getEndsAt()?->format(\DateTimeInterface::ATOM),
        //         'is_lifetime' => $subscription->isLifetime(),
        //     ],
        //     'usage' => [
        //         'students_used' => $studentsUsed,
        //         'students_limit' => $maxStudentsLimit,
        //     ],
        // ];

        return new JsonResponse([]);
    }
}
