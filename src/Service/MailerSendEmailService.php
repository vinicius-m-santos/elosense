<?php

namespace App\Service;

use MailerSend\Helpers\Builder\EmailParams;
use MailerSend\Helpers\Builder\Recipient;
use MailerSend\MailerSend;
use Psr\Log\LoggerInterface;

class MailerSendEmailService implements EmailServiceInterface
{
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly string $defaultFrom,
        private readonly string $apiKey,
        private readonly string $defaultFromName = 'Elosense',
    ) {
        if (empty($this->defaultFrom) || !str_contains($this->defaultFrom, '@')) {
            throw new \InvalidArgumentException('MAILERSEND_FROM precisa ser um email válido.');
        }
    }

    /**
     * @inheritdoc
     */
    public function sendEmail(
        string $to,
        string $subject,
        string $body,
        ?string $from = null
    ): bool {
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException(sprintf('Email de destino inválido: %s', $to));
        }

        if (empty($subject)) {
            throw new \InvalidArgumentException('O assunto do email não pode ser vazio.');
        }

        try {
            $mailerSend = new MailerSend(['api_key' => $this->apiKey]);
            $fromAddress = $from ?? $this->defaultFrom;

            $recipients = [new Recipient($to, '')];
            $emailParams = (new EmailParams())
                ->setFrom($fromAddress)
                ->setFromName($this->defaultFromName)
                ->setRecipients($recipients)
                ->setSubject($subject)
                ->setText($body);

            $mailerSend->email->send($emailParams);

            $this->logger->info('Email enviado via MailerSend', [
                'to' => $to,
                'subject' => $subject,
            ]);

            return true;
        } catch (\Throwable $e) {
            $this->logger->error('Erro ao enviar email via MailerSend', [
                'error' => $e->getMessage(),
                'to' => $to,
                'subject' => $subject,
            ]);

            throw new \RuntimeException('Erro ao enviar email via MailerSend: ' . $e->getMessage(), 0, $e);
        }
    }
}
