<?php

namespace App\Service;

use Google\AccessToken\Verify;

class GoogleAuthService
{
    public function __construct(
        private readonly string $googleClientId
    ) {}

    /**
     * @return array{sub: string, email?: string, email_verified?: bool, name?: string, given_name?: string, family_name?: string, picture?: string}
     */
    public function verifyIdToken(string $idToken): array
    {
        $verify = new Verify();
        $payload = $verify->verifyIdToken($idToken, $this->googleClientId);

        if ($payload === false || !isset($payload['sub'])) {
            throw new \InvalidArgumentException('Token Google inválido ou expirado');
        }

        return $payload;
    }
}
