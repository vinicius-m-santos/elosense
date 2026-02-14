<?php

namespace App\Service;

/**
 * Throttles Riot API calls to stay under Riot limits (development: 20/s, 100/2min).
 * Uses slightly lower limits to avoid 429s.
 */
class RiotApiThrottler
{
    private const MAX_PER_SECOND = 18;
    private const MAX_PER_TWO_MINUTES = 90;
    private const TWO_MINUTES_SECONDS = 120;

    /** @var list<float> request timestamps (microtime true) */
    private array $requestTimes = [];

    public function waitIfNeeded(): void
    {
        $now = microtime(true);
        $this->pruneOlderThan($now - self::TWO_MINUTES_SECONDS);
        if (\count($this->requestTimes) >= self::MAX_PER_TWO_MINUTES) {
            $oldest = min($this->requestTimes);
            $sleep = self::TWO_MINUTES_SECONDS - ($now - $oldest);
            if ($sleep > 0) {
                usleep((int) ceil($sleep * 1_000_000));
                $now = microtime(true);
            }
        }
        $this->pruneOlderThan($now - 1.0);
        if (\count($this->requestTimes) >= self::MAX_PER_SECOND) {
            $oldest = min($this->requestTimes);
            $sleep = 1.0 - ($now - $oldest);
            if ($sleep > 0) {
                usleep((int) ceil($sleep * 1_000_000));
            }
        }
    }

    public function recordRequest(): void
    {
        $this->requestTimes[] = microtime(true);
    }

    private function pruneOlderThan(float $minTime): void
    {
        $this->requestTimes = array_values(array_filter($this->requestTimes, fn (float $t) => $t > $minTime));
    }
}
