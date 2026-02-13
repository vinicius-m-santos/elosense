<?php

namespace App\Exception;

use Symfony\Component\Security\Core\Exception\AuthenticationException;

class EmailNotVerifiedException extends AuthenticationException
{
    public function getMessageKey(): string
    {
        return 'Conta não verificada. Por favor, verifique seu email antes de fazer login.';
    }
}
