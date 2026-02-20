<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * HTTP exception that carries a stable string code for the API response (error.code).
 * Used so the frontend can display user-friendly messages or use i18n by code.
 */
class UserFacingHttpException extends HttpException
{
    public function __construct(
        int $statusCode,
        string $message,
        private readonly string $errorCode,
        ?\Throwable $previous = null,
        array $headers = [],
        int $code = 0,
    ) {
        parent::__construct($statusCode, $message, $previous, $headers, $code);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }
}
