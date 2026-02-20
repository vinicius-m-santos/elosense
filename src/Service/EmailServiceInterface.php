<?php

namespace App\Service;

interface EmailServiceInterface
{
    /**
     * Envia um email.
     *
     * @param string      $to      Email do destinatário
     * @param string      $subject Assunto do email
     * @param string      $body    Corpo do email (texto simples)
     * @param string|null $from    Email do remetente (opcional, usa padrão da config se não fornecido)
     *
     * @throws \InvalidArgumentException Se to/subject forem inválidos
     * @throws \RuntimeException        Quando o provedor rejeita o envio
     */
    public function sendEmail(
        string $to,
        string $subject,
        string $body,
        ?string $from = null
    ): bool;
}
