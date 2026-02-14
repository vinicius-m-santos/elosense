#!/usr/bin/env bash
# Worker: runs app:aggregate:elo-benchmarks every N seconds (default 3600 = 1 hour).
# Configure via: AGGREGATE_INTERVAL_SECONDS.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

INTERVAL="${AGGREGATE_INTERVAL_SECONDS:-3600}"

echo "[aggregate-worker] Starting. Interval=${INTERVAL}s"

while true; do
  echo "[aggregate-worker] Run at $(date '+%Y-%m-%d %H:%M:%S')"
  php bin/console app:aggregate:elo-benchmarks --no-interaction || true
  echo "[aggregate-worker] Sleeping ${INTERVAL}s..."
  sleep "$INTERVAL"
done
