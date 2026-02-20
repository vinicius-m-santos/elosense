<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class EmailVerificationService
{
    public function __construct(
        private readonly EmailServiceInterface $emailService,
        private readonly EntityManagerInterface $em,
        private readonly string $appUrl
    ) {}

    public function sendVerificationEmail(User $user): void
    {
        $token = bin2hex(random_bytes(32));
        $user->setVerificationToken($token);

        $this->em->flush();

        $verificationUrl = rtrim($this->appUrl, '/') . '/verify-email/' . $token;

        $emailBody = "Olá {$user->getFirstName()},\n\n" .
            "Obrigado por se cadastrar!\n\n" .
            "Por favor, clique no link abaixo para verificar sua conta:\n" .
            $verificationUrl . "\n\n" .
            "Se você não se cadastrou, pode ignorar este email.\n\n" .
            "Atenciosamente,\nEquipe Fitrise";

        $this->emailService->sendEmail(
            to: $user->getEmail(),
            subject: 'Verificação de Conta - Fitrise',
            body: $emailBody
        );
    }
}
