<?php

namespace App\Service;

use App\Entity\EloBenchmark;

/**
 * Compares a match's metrics to benchmarks and generates insights (above/below P50/P75).
 */
final class MatchAnalysisService
{
    /**
     * Build analysis from match metrics and optional benchmark.
     * If no benchmark, returns empty insights and a message.
     *
     * @param array{csPerMin?: float, damagePerMin?: float, visionScore?: float, goldPerMin?: ?float, killParticipation?: ?float, deaths?: int} $metrics
     * @return array{insights: array<int, array{metric: string, value: float|int|null, p50: ?float, p75: ?float, interpretation: string, label: string}>, summary: ?string}
     */
    public function analyze(array $metrics, ?EloBenchmark $benchmark): array
    {
        if ($benchmark === null) {
            return [
                'insights' => [],
                'summary' => 'Nenhum benchmark disponível para esta região/elo/posição. Defina região e elo (Tier/Rank) no Dashboard para comparar com as métricas ideais.',
            ];
        }

        $insights = [];
        $higherIsBetter = [
            'csPerMin' => ['p50' => $benchmark->getCsPerMinP50(), 'p75' => $benchmark->getCsPerMinP75(), 'label' => 'CS/min'],
            'damagePerMin' => ['p50' => $benchmark->getDamagePerMinP50(), 'p75' => $benchmark->getDamagePerMinP75(), 'label' => 'Dano/min'],
            'visionScore' => ['p50' => $benchmark->getVisionScoreP50(), 'p75' => $benchmark->getVisionScoreP75(), 'label' => 'Visão'],
            'goldPerMin' => ['p50' => $benchmark->getGoldPerMinP50(), 'p75' => $benchmark->getGoldPerMinP75(), 'label' => 'Ouro/min'],
            'killParticipation' => ['p50' => $benchmark->getKillParticipationP50(), 'p75' => $benchmark->getKillParticipationP75(), 'label' => 'Part. em abates %'],
        ];
        foreach ($higherIsBetter as $key => $ref) {
            $value = $metrics[$key] ?? null;
            if ($value === null && $key !== 'killParticipation' && $key !== 'goldPerMin') {
                continue;
            }
            $v = $value !== null ? (float) $value : null;
            $p50 = $ref['p50'];
            $p75 = $ref['p75'];
            $insights[] = [
                'metric' => $key,
                'value' => $v,
                'p50' => $p50,
                'p75' => $p75,
                'interpretation' => $this->interpretHigherIsBetter($v, $p50, $p75),
                'label' => $ref['label'],
            ];
        }
        // Deaths: lower is better
        $deaths = isset($metrics['deaths']) ? (int) $metrics['deaths'] : null;
        if ($deaths !== null) {
            $p50 = $benchmark->getDeathsP50();
            $p75 = $benchmark->getDeathsP75();
            $insights[] = [
                'metric' => 'deaths',
                'value' => $deaths,
                'p50' => $p50,
                'p75' => $p75,
                'interpretation' => $this->interpretLowerIsBetter($deaths, $p50, $p75),
            'label' => 'Mortes',
        ];
        }

        $summary = $this->buildSummary($insights);
        return [
            'insights' => $insights,
            'summary' => $summary,
        ];
    }

    private function interpretHigherIsBetter(?float $value, ?float $p50, ?float $p75): string
    {
        if ($value === null || ($p50 === null && $p75 === null)) {
            return 'unknown';
        }
        if ($p75 !== null && $value >= $p75) {
            return 'above_p75';
        }
        if ($p50 !== null && $value >= $p50) {
            return 'above_p50';
        }
        if ($p50 !== null && $value < $p50) {
            return 'below_p50';
        }
        return 'unknown';
    }

    private function interpretLowerIsBetter(int $value, ?float $p50, ?float $p75): string
    {
        if ($p50 === null && $p75 === null) {
            return 'unknown';
        }
        if ($p75 !== null && $value <= $p75) {
            return 'below_p75';
        }
        if ($p50 !== null && $value <= $p50) {
            return 'below_p50';
        }
        if ($p75 !== null && $value > $p75) {
            return 'above_p75';
        }
        return 'above_p50';
    }

    /**
     * @param array<int, array{metric: string, interpretation: string}> $insights
     */
    private function buildSummary(array $insights): string
    {
        $strongCount = 0;  // above_p75 for metrics, below_p50/below_p75 for deaths
        $belowMedianCount = 0;  // below_p50 for metrics, above_p75 for deaths
        foreach ($insights as $i) {
            $interp = $i['interpretation'] ?? '';
            $metric = $i['metric'] ?? '';
            if ($metric === 'deaths') {
                if ($interp === 'below_p50' || $interp === 'below_p75') {
                    $strongCount++;
                } elseif ($interp === 'above_p75') {
                    $belowMedianCount++;
                }
            } else {
                if ($interp === 'above_p75') {
                    $strongCount++;
                } elseif ($interp === 'below_p50') {
                    $belowMedianCount++;
                }
            }
        }
        if ($strongCount > 0 && $belowMedianCount === 0) {
            return sprintf('Ótima atuação: %d métrica(s) no P75 ou acima (ou abaixo em mortes).', $strongCount);
        }
        if ($strongCount > 0 && $belowMedianCount > 0) {
            return sprintf('%d métrica(s) acima do benchmark; %d abaixo da mediana. Foque nestas para evoluir.', $strongCount, $belowMedianCount);
        }
        if ($belowMedianCount > 0) {
            return sprintf('%d métrica(s) abaixo da mediana. Foque nelas para evoluir.', $belowMedianCount);
        }
        return 'Desempenho próximo à mediana do elo/posição.';
    }
}
