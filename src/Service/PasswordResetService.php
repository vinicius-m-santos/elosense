<?php

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class PasswordResetService
{
    public function __construct(
        private readonly MailgunEmailService $mailgunEmailService,
        private readonly EntityManagerInterface $em,
        private readonly string $appUrl
    ) {}

    public function sendPasswordResetEmail(User $user): void
    {
        $token = bin2hex(random_bytes(32));
        $user->setResetToken($token);

        $user->setResetTokenExpiresAt(new \DateTimeImmutable('+24 hours'));

        $this->em->flush();

        $resetUrl = rtrim($this->appUrl, '/') . '/reset-password/' . $token;

        $emailBody = "Olá {$user->getFirstName()},\n\n" .
            "Recebemos uma solicitação para redefinir sua senha.\n\n" .
            "Por favor, clique no link abaixo para redefinir sua senha:\n" .
            $resetUrl . "\n\n" .
            "Este link expira em 24 horas.\n\n" .
            "Se você não solicitou esta recuperação de senha, pode ignorar este email.\n\n" .
            "Atenciosamente,\nEquipe Fitrise";

        $this->mailgunEmailService->sendEmail(
            to: $user->getEmail(),
            subject: 'Recuperação de Senha - Fitrise',
            body: $emailBody
        );
    }
}
