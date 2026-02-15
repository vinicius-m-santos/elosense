<?php

namespace App\Service;

/**
 * Throttles Riot API calls per endpoint type to respect Riot rate limits.
 * Used by the ranked-sample scraper. Limits are ~95% of official values to avoid 429s.
 *
 * Endpoint limits (Riot docs; we use slightly lower):
 * - league/v4/entries/{queue}/{tier}/{division}: 50 / 10s  -> 48/10s
 * - league/v4/masterleagues|grandmasterleagues|challengerleagues: 30/10s & 500/10min -> 28/10s & 475/600s
 * - summoner/v4/summoners/by-puuid: 1600 / 1min -> 1500/60s
 * - match/v5 (ids + by id): 2000 / 10s -> 1900/10s
 */
class RiotApiThrottler
{
    /** Throttle type: league entries by tier/division (50/10s). */
    public const TYPE_LEAGUE_ENTRIES = 'league_entries';

    /** Throttle type: master/grandmaster/challenger leagues (30/10s & 500/10min). */
    public const TYPE_LEAGUE_MASTER_GM_CHALLENGER = 'league_master_gm_challenger';

    /** Throttle type: summoner by-puuid or by-id (1600/1min). */
    public const TYPE_SUMMONER = 'summoner';

    /** Throttle type: match-v5 (match ids by puuid + match by id share limit, 2000/10s). */
    public const TYPE_MATCH_V5 = 'match_v5';

    /** @var array<string, list<float>> request timestamps (microtime) per type */
    private array $buckets = [];

    /** @var array<string, list<array{0: int, 1: int}>> type => [{limit, windowSeconds}, ...] */
    private const RULES = [
        self::TYPE_LEAGUE_ENTRIES => [
            [48, 10],
        ],
        self::TYPE_LEAGUE_MASTER_GM_CHALLENGER => [
            [28, 10],   // 30/10s -> 28
            [475, 600], // 500/10min -> 475/600s
        ],
        self::TYPE_SUMMONER => [
            [1500, 60], // 1600/1min -> 1500/60s
        ],
        self::TYPE_MATCH_V5 => [
            [1900, 10], // 2000/10s -> 1900
        ],
    ];

    public function waitIfNeeded(string $type): void
    {
        $rules = self::RULES[$type] ?? null;
        if ($rules === null) {
            return;
        }

        $now = microtime(true);
        $this->ensureBucket($type);

        foreach ($rules as [$limit, $windowSeconds]) {
            $this->waitForRule($type, $limit, $windowSeconds, $now);
            $now = microtime(true);
        }
    }

    public function recordRequest(string $type): void
    {
        $this->ensureBucket($type);
        $this->buckets[$type][] = microtime(true);
    }

    private function ensureBucket(string $type): void
    {
        if (!isset($this->buckets[$type])) {
            $this->buckets[$type] = [];
        }
    }

    private function waitForRule(string $type, int $limit, int $windowSeconds, float $now): void
    {
        $cutoff = $now - $windowSeconds;
        $this->buckets[$type] = array_values(array_filter(
            $this->buckets[$type],
            fn (float $t) => $t > $cutoff
        ));

        if (\count($this->buckets[$type]) < $limit) {
            return;
        }

        $oldest = min($this->buckets[$type]);
        $sleep = $windowSeconds - ($now - $oldest);
        if ($sleep > 0) {
            usleep((int) ceil($sleep * 1_000_000));
        }
    }
}
