#!/bin/bash
set -e

# Run migrations
php bin/console doctrine:migrations:migrate --no-interaction

# Generate JWT keys if missing
if [ ! -f config/jwt/private.pem ]; then
  mkdir -p config/jwt
  openssl genpkey -out config/jwt/private.pem -algorithm RSA -pkeyopt rsa_keygen_bits:4096
  openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout
fi

# Start server
php -c ./public/.user.ini -S 0.0.0.0:8080 -t public