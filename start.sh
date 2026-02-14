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

# Cache
php bin/console cache:clear --env=prod
php bin/console cache:warmup --env=prod

# Workers (background): scraper loop + aggregate every hour
mkdir -p var/log
nohup bash ./bin/scraper-worker.sh >> var/log/scraper-worker.log 2>&1 &
echo "Scraper worker started (log: var/log/scraper-worker.log)"
nohup bash ./bin/aggregate-worker.sh >> var/log/aggregate-worker.log 2>&1 &
echo "Aggregate worker started (log: var/log/aggregate-worker.log)"

# Start server (foreground)
php -c ./public/.user.ini -S 0.0.0.0:$PORT -t public