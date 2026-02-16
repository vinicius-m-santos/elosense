<?php

namespace App\Service;

use App\Entity\EloBenchmark;
use App\Repository\EloBenchmarkRepository;

/**
 * Returns benchmarks by (region, tier, rank, role, matchup) with fallbacks:
 * 1) exact matchup (champion + opponent), 2) role-only (same tier/rank).
 */
final class BenchmarkService
{
    private const RANKED_QUEUES = [420, 440];

    public function __construct(
        private readonly EloBenchmarkRepository $benchmarkRepository
    ) {}

    /**
     * Get the best available benchmark for the given context.
     * Tries exact matchup first, then role-only (same tier/rank).
     *
     * @param array{region: string, queueId: ?int, tier: ?string, rank: ?string, teamPosition: string, championId: ?int, opponentChampionId: ?int} $context
     */
    public function getBenchmark(array $context): ?EloBenchmark
    {
        $rawPosition = $context['teamPosition'] ?? '';
        if ($rawPosition === '' || $rawPosition === null) {
            return null;
        }
        $region = $this->normalizeRegion($context['region'] ?? '');
        $queueId = isset($context['queueId']) && \in_array((int) $context['queueId'], self::RANKED_QUEUES, true)
            ? (int) $context['queueId'] : 420;
        $tier = $this->normalizeTier($context['tier'] ?? '');
        $rank = $this->normalizeRank($context['rank'] ?? '');
        $teamPosition = $this->normalizePosition($rawPosition);
        $championId = isset($context['championId']) && $context['championId'] !== null ? (int) $context['championId'] : null;
        $opponentChampionId = isset($context['opponentChampionId']) && $context['opponentChampionId'] !== null ? (int) $context['opponentChampionId'] : null;

        $tiersWithoutRank = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];
        $tierAllowsEmptyRank = \in_array($tier, $tiersWithoutRank, true);
        if ($region === '' || $tier === '') {
            return null;
        }
        if ($rank === '' && !$tierAllowsEmptyRank) {
            return null;
        }

        // Benchmarks for Master/GM/Challenger are stored with rank 'I' (normalization in SampleMatchStorageService).
        $rankForLookup = $rank;
        if ($rank === '' && $tierAllowsEmptyRank) {
            $rankForLookup = 'I';
        }

        // 1) Exact matchup
        if ($championId !== null && $opponentChampionId !== null) {
            $benchmark = $this->benchmarkRepository->findOneByKeys($region, $queueId, $tier, $rankForLookup, $teamPosition, $championId, $opponentChampionId);
            if ($benchmark !== null) {
                return $benchmark;
            }
        }

        // 2) Role-only (same tier/rank)
        return $this->benchmarkRepository->findOneByKeys($region, $queueId, $tier, $rankForLookup, $teamPosition, null, null);
    }

    /**
     * Convert benchmark entity to an array suitable for API (ideal benchmarks).
     *
     * @return array<string, mixed>
     */
    public function benchmarkToIdealArray(EloBenchmark $b): array
    {
        return [
            'sampleSize' => $b->getSampleSize(),
            'csPerMin' => ['avg' => $b->getCsPerMinAvg(), 'p50' => $b->getCsPerMinP50(), 'p75' => $b->getCsPerMinP75()],
            'damagePerMin' => ['avg' => $b->getDamagePerMinAvg(), 'p50' => $b->getDamagePerMinP50(), 'p75' => $b->getDamagePerMinP75()],
            'visionScore' => ['avg' => $b->getVisionScoreAvg(), 'p50' => $b->getVisionScoreP50(), 'p75' => $b->getVisionScoreP75()],
            'goldPerMin' => ['avg' => $b->getGoldPerMinAvg(), 'p50' => $b->getGoldPerMinP50(), 'p75' => $b->getGoldPerMinP75()],
            'killParticipation' => ['avg' => $b->getKillParticipationAvg(), 'p50' => $b->getKillParticipationP50(), 'p75' => $b->getKillParticipationP75()],
            'deaths' => ['avg' => $b->getDeathsAvg(), 'p50' => $b->getDeathsP50(), 'p75' => $b->getDeathsP75()],
        ];
    }

    private function normalizeRegion(string $v): string
    {
        return strtoupper(trim($v));
    }

    private function normalizeTier(string $v): string
    {
        return strtoupper(trim($v));
    }

    private function normalizeRank(string $v): string
    {
        return strtoupper(trim($v));
    }

    private function normalizePosition(string $v): string
    {
        $key = strtoupper(trim($v));
        $map = ['TOP' => 'TOP', 'JUNGLE' => 'JUNGLE', 'MIDDLE' => 'MID', 'MID' => 'MID', 'BOTTOM' => 'BOTTOM', 'ADC' => 'BOTTOM', 'UTILITY' => 'UTILITY', 'SUPPORT' => 'UTILITY'];
        return $map[$key] ?? $v ?: 'UTILITY';
    }
}
