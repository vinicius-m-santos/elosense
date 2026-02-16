#!/usr/bin/env bash
# Worker: runs app:scraper:ranked-sample in a loop. After each run (including
# "All strata already completed"), sleeps a configurable interval and runs again.
# Configure via: SCRAPER_REGION, SCRAPER_QUEUE, SCRAPER_LOOP_SLEEP_SECONDS.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

REGION="${SCRAPER_REGION:-BR1}"
QUEUE="${SCRAPER_QUEUE:-all}"
SLEEP_SECONDS="${SCRAPER_LOOP_SLEEP_SECONDS:-300}"

echo "[scraper-worker] Starting. Region=$REGION Queue=$QUEUE Sleep=${SLEEP_SECONDS}s"

while true; do
  echo "[scraper-worker] Run at $(date '+%Y-%m-%d %H:%M:%S')"
  php bin/console app:scraper:ranked-sample --region "$REGION" --queue "$QUEUE" --players-per-stratum 10 --matches-per-player 3 --no-interaction || true
  echo "[scraper-worker] Sleeping ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done
