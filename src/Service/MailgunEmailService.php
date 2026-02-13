<?php

namespace App\Service;

use Mailgun\Mailgun;
use Psr\Log\LoggerInterface;

class MailgunEmailService
{
    private Mailgun $mailgun;

    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly string $domain,
        private readonly string $defaultFrom,
        string $apiKey
    ) {
        if (empty($this->domain) || str_contains($this->domain, '://')) {
            throw new \InvalidArgumentException('MAILGUN_DOMAIN deve conter apenas o domínio (ex.: mg.seudominio.com). Valor atual: ' . $this->domain);
        }

        if (empty($this->defaultFrom) || !str_contains($this->defaultFrom, '@')) {
            throw new \InvalidArgumentException('MAILGUN_FROM precisa ser um email válido.');
        }

        $this->mailgun = Mailgun::create($apiKey);
    }

    /**
     * Envia um email via Mailgun
     *
     * @param string $to Email do destinatário
     * @param string $subject Assunto do email
     * @param string $body Corpo do email (texto simples)
     * @param string|null $from Email do remetente (opcional, usa config do construtor se não fornecido)
     * @throws \RuntimeException Quando o Mailgun rejeita o envio
     * @return bool True se enviado com sucesso
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
            $fromAddress = $from ?? $this->defaultFrom;

            $result = $this->mailgun->messages()->send($this->domain, [
                'from' => $fromAddress,
                'to' => $to,
                'subject' => $subject,
                'text' => $body,
            ]);

            $this->logger->info('Email enviado via Mailgun', [
                'messageId' => $result->getId(),
                'to' => $to,
                'subject' => $subject,
            ]);

            return true;
        } catch (\Throwable $e) {
            $this->logger->error('Erro ao enviar email via Mailgun', [
                'error' => $e->getMessage(),
                'to' => $to,
                'subject' => $subject,
            ]);

            throw new \RuntimeException('Erro ao enviar email via Mailgun: ' . $e->getMessage(), 0, $e);
        }
    }
}
