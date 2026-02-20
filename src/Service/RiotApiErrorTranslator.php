<?php

namespace App\Service;

use Symfony\Component\HttpClient\Exception\TimeoutException;
use Symfony\Contracts\HttpClient\Exception\HttpExceptionInterface;

/**
 * Translates Riot API / HttpClient exceptions into user-friendly message + stable code.
 * Never exposes URLs, raw HTTP codes or technical details to the end user.
 */
final class RiotApiErrorTranslator
{
    public const CONTEXT_PLAYER = 'player';
    public const CONTEXT_MATCH = 'match';
    public const CONTEXT_MATCHES = 'matches';

    /**
     * @return array{message: string, code: string}
     */
    public function translate(\Throwable $e, string $context = self::CONTEXT_PLAYER): array
    {
        $statusCode = $this->extractStatusCode($e);

        if ($statusCode !== null) {
            return $this->translateByStatus($statusCode, $context);
        }

        if ($e instanceof TimeoutException || $e instanceof \Symfony\Component\HttpClient\Exception\TransportException) {
            return [
                'message' => 'Não foi possível conectar. Verifique sua internet e tente novamente.',
                'code' => 'network_error',
            ];
        }

        $msg = strtolower($e->getMessage());
        if (str_contains($msg, '404') || str_contains($msg, 'not found')) {
            return $this->messageForNotFound($context);
        }
        if (str_contains($msg, '403') || str_contains($msg, 'forbidden')) {
            return [
                'message' => 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
                'code' => 'service_unavailable',
            ];
        }
        if (str_contains($msg, '429')) {
            return [
                'message' => 'Muitas buscas no momento. Aguarde alguns minutos e tente novamente.',
                'code' => 'rate_limited',
            ];
        }
        if (str_contains($msg, '500') || str_contains($msg, '502') || str_contains($msg, '503') || str_contains($msg, 'timeout')) {
            return [
                'message' => 'Servidores com instabilidade. Tente novamente em alguns minutos.',
                'code' => 'riot_server_error',
            ];
        }

        return [
            'message' => 'Algo deu errado ao buscar os dados. Tente novamente.',
            'code' => 'api_error',
        ];
    }

    private function extractStatusCode(\Throwable $e): ?int
    {
        if ($e instanceof HttpExceptionInterface) {
            return $e->getResponse()->getStatusCode();
        }
        $code = $e->getCode();
        if (is_int($code) && $code >= 400 && $code < 600) {
            return $code;
        }
        return null;
    }

    /**
     * @return array{message: string, code: string}
     */
    private function translateByStatus(int $statusCode, string $context): array
    {
        if ($statusCode === 404) {
            return $this->messageForNotFound($context);
        }
        if ($statusCode === 403) {
            return [
                'message' => 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
                'code' => 'service_unavailable',
            ];
        }
        if ($statusCode === 429) {
            return [
                'message' => 'Muitas buscas no momento. Aguarde alguns minutos e tente novamente.',
                'code' => 'rate_limited',
            ];
        }
        if ($statusCode >= 500 && $statusCode < 600) {
            return [
                'message' => 'Os servidores do jogo estão com instabilidade. Tente novamente em alguns minutos.',
                'code' => 'riot_server_error',
            ];
        }
        return [
            'message' => 'Algo deu errado ao buscar os dados. Tente novamente.',
            'code' => 'api_error',
        ];
    }

    /**
     * @return array{message: string, code: string}
     */
    private function messageForNotFound(string $context): array
    {
        if ($context === self::CONTEXT_MATCH) {
            return [
                'message' => 'Partida não encontrada.',
                'code' => 'match_not_found',
            ];
        }
        if ($context === self::CONTEXT_MATCHES) {
            return [
                'message' => 'Partidas temporariamente indisponíveis. Tente novamente em alguns minutos.',
                'code' => 'matches_unavailable',
            ];
        }
        return [
            'message' => 'Jogador não encontrado.',
            'code' => 'player_not_found',
        ];
    }
}
