<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Gesdinet\JWTRefreshTokenBundle\Entity\RefreshToken as BaseRefreshToken;

/**
 * @ORM\Entity()
 * @ORM\Table(name="refresh_tokens")
 */
#[ORM\Entity]
#[ORM\Table(name: '`refresh_tokens`')]
class RefreshToken extends BaseRefreshToken
{
    // No extra fields needed; the parent already has everything
}