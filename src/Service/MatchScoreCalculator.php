<?php

namespace App\Service;

use App\Entity\EloBenchmark;

/**
 * Calculates a letter score (S/A/B/C/D) for a match from metrics and context.
 *
 * Context includes:
 * - teamPosition: TOP, JUNGLE, MID, BOTTOM, UTILITY — different weights and expectations per role.
 * - tier/rank: elo adjusts "good" thresholds (higher elo = higher expectations).
 * - gameDurationSeconds: deaths are normalized per 10 min and use a non-linear curve (early deaths hurt more).
 * - benchmark: when provided (from BenchmarkService by elo/position/champion), each metric is scored vs P50/P75.
 *
 * Metric-specific behaviour:
 * - Deaths: non-linear (first deaths penalized more), normalized by game length (deaths per 10 min).
 * - Damage/min: role-specific caps (e.g. UTILITY lower); when benchmark exists, compared to P50/P75.
 * - Vision: higher expectation and weight for UTILITY; explicit reference scale otherwise.
 *
 * Champion-specific benchmarks: when the benchmark is for a specific champion (from getBenchmark with championId),
 * the score reflects performance relative to that champion's typical stats. Otherwise role-only benchmarks are used.
 */
final class MatchScoreCalculator
{
    private const LETTER_THRESHOLDS = [
        'S' => 0.90,
        'A' => 0.75,
        'B' => 0.55,
        'C' => 0.35,
    ];

    /** Tier order for cap scaling (lower index = lower expectations). */
    private const TIER_ORDER = [
        'IRON' => 0, 'BRONZE' => 1, 'SILVER' => 2, 'GOLD' => 3, 'PLATINUM' => 4,
        'EMERALD' => 5, 'DIAMOND' => 6, 'MASTER' => 7, 'GRANDMASTER' => 8, 'CHALLENGER' => 9,
    ];

    /**
     * Role weights: cs, deaths, damage, vision, kp.
     * UTILITY emphasizes vision and KP; MID/BOTTOM emphasize CS and damage; JUNGLE balanced.
     */
    private const ROLE_WEIGHTS = [
        'TOP' => [0.22, 0.26, 0.22, 0.15, 0.15],
        'JUNGLE' => [0.15, 0.25, 0.20, 0.22, 0.18],
        'MID' => [0.25, 0.22, 0.25, 0.13, 0.15],
        'BOTTOM' => [0.25, 0.22, 0.25, 0.13, 0.15],
        'UTILITY' => [0.10, 0.22, 0.13, 0.30, 0.25],
    ];

    /** Fallback caps per role: [csPerMin max, damagePerMin max, visionScore max]. Used when no benchmark. */
    private const ROLE_CAPS = [
        'TOP' => [8.5, 650, 45],
        'JUNGLE' => [6.0, 550, 55],
        'MID' => [9.0, 750, 40],
        'BOTTOM' => [9.0, 800, 40],
        'UTILITY' => [4.0, 350, 65],
    ];

    /** Default caps when position unknown. */
    private const DEFAULT_CAPS = [8.0, 650, 50];

    /**
     * Calculate letter score S/A/B/C/D.
     *
     * @param array{csPerMin: float, deaths: int, damagePerMin: float, visionScore: float, killParticipation?: ?float} $metrics
     * @param array{teamPosition?: string, champion?: string, championId?: ?int, tier?: string, rank?: string, gameDurationSeconds?: ?int, benchmark?: ?EloBenchmark} $context
     */
    public function calculateScore(array $metrics, array $context = []): string
    {
        $benchmark = $context['benchmark'] ?? null;
        if ($benchmark instanceof EloBenchmark) {
            return $this->scoreFromBenchmark($metrics, $context, $benchmark);
        }
        return $this->scoreFromFallback($metrics, $context);
    }

    /**
     * Score using P50/P75 from benchmark (elo/position, optionally champion-specific).
     */
    private function scoreFromBenchmark(array $metrics, array $context, EloBenchmark $benchmark): string
    {
        $position = $this->normalizePosition($context['teamPosition'] ?? '');
        $weights = self::ROLE_WEIGHTS[$position] ?? self::ROLE_WEIGHTS['MID'];

        $cs = $this->normHigher($metrics['csPerMin'] ?? 0, $benchmark->getCsPerMinP50(), $benchmark->getCsPerMinP75());
        $deaths = $this->normDeathsBenchmark((int) ($metrics['deaths'] ?? 0), $benchmark->getDeathsP50(), $benchmark->getDeathsP75(), $context['gameDurationSeconds'] ?? null);
        $damage = $this->normHigher($metrics['damagePerMin'] ?? 0, $benchmark->getDamagePerMinP50(), $benchmark->getDamagePerMinP75());
        $vision = $this->normHigher($metrics['visionScore'] ?? 0, $benchmark->getVisionScoreP50(), $benchmark->getVisionScoreP75());
        $kp = $this->normHigher($metrics['killParticipation'] ?? 0, $benchmark->getKillParticipationP50(), $benchmark->getKillParticipationP75());

        $raw = $cs * $weights[0] + $deaths * $weights[1] + $damage * $weights[2] + $vision * $weights[3] + $kp * $weights[4];
        $raw = $this->normalizeWeightsSum($raw, $weights);
        return $this->rawToLetter(max(0, min(1, $raw)));
    }

    /**
     * Fallback when no benchmark: role-based caps and tier scaling, non-linear deaths by duration.
     */
    private function scoreFromFallback(array $metrics, array $context): string
    {
        $position = $this->normalizePosition($context['teamPosition'] ?? '');
        $weights = self::ROLE_WEIGHTS[$position] ?? self::ROLE_WEIGHTS['MID'];
        $caps = self::ROLE_CAPS[$position] ?? self::DEFAULT_CAPS;
        $tier = strtoupper(trim($context['tier'] ?? 'GOLD'));
        $tierIndex = self::TIER_ORDER[$tier] ?? 3;
        $scale = $this->tierScale($tierIndex);
        $gameSec = $context['gameDurationSeconds'] ?? null;

        $csNorm = $this->normCsFallback($metrics['csPerMin'] ?? 0, $caps[0], $scale);
        $deathsNorm = $this->normDeathsFallback((int) ($metrics['deaths'] ?? 0), $gameSec);
        $damageNorm = $this->normDamageFallback($metrics['damagePerMin'] ?? 0, $caps[1], $scale, $position);
        $visionNorm = $this->normVisionFallback($metrics['visionScore'] ?? 0, $caps[2], $scale, $position);
        $kpNorm = min(1.0, ($metrics['killParticipation'] ?? 0) / 100.0);

        $raw = $csNorm * $weights[0] + $deathsNorm * $weights[1] + $damageNorm * $weights[2] + $visionNorm * $weights[3] + $kpNorm * $weights[4];
        $raw = $this->normalizeWeightsSum($raw, $weights);
        return $this->rawToLetter(max(0, min(1, $raw)));
    }

    /** Higher is better: 0 at/below P50, 1 at/above P75, linear between. */
    private function normHigher(float $value, ?float $p50, ?float $p75): float
    {
        if ($p50 === null && $p75 === null) {
            return 0.5;
        }
        if ($p75 !== null && $value >= $p75) {
            return 1.0;
        }
        if ($p50 !== null && $value <= $p50) {
            return 0.0;
        }
        if ($p50 !== null && $p75 !== null && $p75 > $p50) {
            return (float) (($value - $p50) / ($p75 - $p50));
        }
        return $p50 !== null && $value >= $p50 ? 1.0 : 0.0;
    }

    /** Deaths: lower is better. 1 when <= P50, 0 when >= P75, linear between. Optionally soften by duration. */
    private function normDeathsBenchmark(int $deaths, ?float $p50, ?float $p75, ?int $gameDurationSeconds): float
    {
        if ($p50 === null && $p75 === null) {
            return 0.5;
        }
        if ($p50 !== null && $deaths <= $p50) {
            return 1.0;
        }
        if ($p75 !== null && $deaths >= $p75) {
            return 0.0;
        }
        if ($p50 !== null && $p75 !== null && $p75 > $p50) {
            $linear = (float) (($p75 - $deaths) / ($p75 - $p50));
            return max(0, min(1, $linear));
        }
        return $p75 !== null && $deaths <= $p75 ? 1.0 : 0.0;
    }

    /** Non-linear deaths for fallback: deaths per 10 min, then curve (early deaths hurt more). */
    private function normDeathsFallback(int $deaths, ?int $gameDurationSeconds): float
    {
        $minutes = $gameDurationSeconds !== null && $gameDurationSeconds > 0
            ? $gameDurationSeconds / 60.0
            : 1.0;
        $per10 = $minutes > 0 ? ($deaths / ($minutes / 10.0)) : $deaths;
        if ($per10 <= 0) {
            return 1.0;
        }
        if ($per10 >= 4.0) {
            return 0.0;
        }
        $x = $per10 / 4.0;
        $curve = 1.0 - pow($x, 1.3);
        return max(0, min(1, $curve));
    }

    private function normCsFallback(float $csPerMin, float $cap, float $tierScale): float
    {
        $capAdj = $cap * $tierScale;
        if ($capAdj <= 0) {
            return 1.0;
        }
        return min(1.0, max(0, $csPerMin / $capAdj));
    }

    private function normDamageFallback(float $damagePerMin, float $cap, float $tierScale, string $position): float
    {
        $capAdj = $cap * $tierScale;
        if ($capAdj <= 0) {
            return 1.0;
        }
        return min(1.0, max(0, $damagePerMin / $capAdj));
    }

    private function normVisionFallback(float $visionScore, float $cap, float $tierScale, string $position): float
    {
        $capAdj = $cap * $tierScale;
        if ($capAdj <= 0) {
            return 1.0;
        }
        return min(1.0, max(0, $visionScore / $capAdj));
    }

    /** Tier scale: higher elo = slightly higher bar (1.0 at GOLD, ~0.85 Iron, ~1.1 Diamond+). */
    private function tierScale(int $tierIndex): float
    {
        return 0.85 + ($tierIndex * 0.025);
    }

    /** Weights may not sum to 1; normalize so raw stays in [0,1] when each component is [0,1]. */
    private function normalizeWeightsSum(float $raw, array $weights): float
    {
        $sum = array_sum($weights);
        if ($sum <= 0) {
            return 0.5;
        }
        return $raw / $sum;
    }

    private function rawToLetter(float $raw): string
    {
        if ($raw >= self::LETTER_THRESHOLDS['S']) {
            return 'S';
        }
        if ($raw >= self::LETTER_THRESHOLDS['A']) {
            return 'A';
        }
        if ($raw >= self::LETTER_THRESHOLDS['B']) {
            return 'B';
        }
        if ($raw >= self::LETTER_THRESHOLDS['C']) {
            return 'C';
        }
        return 'D';
    }

    private function normalizePosition(string $position): string
    {
        $key = strtoupper(trim($position));
        $map = [
            'TOP' => 'TOP', 'JUNGLE' => 'JUNGLE', 'MIDDLE' => 'MID', 'MID' => 'MID',
            'BOTTOM' => 'BOTTOM', 'ADC' => 'BOTTOM', 'UTILITY' => 'UTILITY', 'SUPPORT' => 'UTILITY',
        ];
        return $map[$key] ?? 'MID';
    }
}
