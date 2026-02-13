<?php

namespace App\Service;

use App\Entity\Personal;
use App\Entity\Plan;
use App\Entity\Subscription;
use App\Repository\ClientRepository;
use App\Repository\PlanRepository;
use App\Repository\SubscriptionRepository;

/**
 * Centraliza verificação de limites/capabilities do plano do personal.
 * Evita lógica espalhada do tipo if (plan === "free").
 */
class SubscriptionService
{
    public function __construct(
        private readonly SubscriptionRepository $subscriptionRepository,
        private readonly PlanRepository $planRepository,
        private readonly ClientRepository $clientRepository
    ) {}

    /**
     * Retorna o limite da capability para o personal (null = ilimitado).
     */
    public function getCapabilityLimit(Personal $personal, string $capability): ?int
    {
        $subscription = $this->subscriptionRepository->findActiveByPersonal($personal);
        if ($subscription === null) {
            return $this->getDefaultPlanCapabilityLimit($capability);
        }
        return $subscription->getPlan()->getCapabilityLimit($capability);
    }

    /**
     * Quantidade atual usada para a capability (ex: número de alunos).
     */
    public function getCapabilityUsage(Personal $personal, string $capability): int
    {
        if ($capability === Plan::CAPABILITY_MAX_STUDENTS) {
            return $this->clientRepository->countByPersonal($personal);
        }
        return 0;
    }

    /**
     * Verifica se o personal pode adicionar mais um aluno.
     */
    public function canAddStudent(Personal $personal): bool
    {
        $limit = $this->getCapabilityLimit($personal, Plan::CAPABILITY_MAX_STUDENTS);
        if ($limit === null) {
            return true; // ilimitado
        }
        $current = $this->getCapabilityUsage($personal, Plan::CAPABILITY_MAX_STUDENTS);
        return $current < $limit;
    }

    /**
     * Cria uma assinatura Free para um personal recém-criado (sem flush).
     * Deve ser chamado antes do flush para que user/personal já tenham sido persistidos.
     */
    public function createSubscriptionForNewPersonal(Personal $personal): Subscription
    {
        $plan = $this->planRepository->findByCode(Plan::CODE_FREE);
        if ($plan === null) {
            throw new \RuntimeException('Plano Free não configurado. Execute as migrations/fixtures.');
        }
        $subscription = new Subscription();
        $subscription->setPersonal($personal);
        $subscription->setPlan($plan);
        $subscription->setStatus(Subscription::STATUS_ACTIVE);
        $subscription->setStartedAt(new \DateTimeImmutable());
        $subscription->setEndsAt(null);
        $this->subscriptionRepository->add($subscription, false);
        $personal->getSubscriptions()->add($subscription);
        return $subscription;
    }

    /**
     * Garante assinatura ativa para o personal (cria Free se não existir).
     */
    public function ensureActiveSubscription(Personal $personal): \App\Entity\Subscription
    {
        $subscription = $this->subscriptionRepository->findActiveByPersonal($personal);
        if ($subscription !== null) {
            return $subscription;
        }
        $plan = $this->planRepository->findByCode(Plan::CODE_FREE);
        if ($plan === null) {
            throw new \RuntimeException('Plano Free não configurado. Execute as migrations/fixtures.');
        }
        $subscription = new Subscription();
        $subscription->setPersonal($personal);
        $subscription->setPlan($plan);
        $subscription->setStatus(Subscription::STATUS_ACTIVE);
        $subscription->setStartedAt(new \DateTimeImmutable());
        $subscription->setEndsAt(null);
        $this->subscriptionRepository->add($subscription);
        $personal->getSubscriptions()->add($subscription);
        return $subscription;
    }

    private function getDefaultPlanCapabilityLimit(string $capability): ?int
    {
        $plan = $this->planRepository->findByCode(Plan::CODE_FREE);
        if ($plan === null) {
            return 3; // fallback seguro
        }
        return $plan->getCapabilityLimit($capability);
    }
}
