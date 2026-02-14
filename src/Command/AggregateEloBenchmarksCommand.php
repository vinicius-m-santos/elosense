<?php

namespace App\Command;

use App\Entity\EloBenchmark;
use App\Repository\EloBenchmarkRepository;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:aggregate:elo-benchmarks',
    description: 'Aggregate sample_match_participant into elo_benchmark (AVG, P50, P75) by region, queue, tier, rank, team_position and optionally matchup',
)]
final class AggregateEloBenchmarksCommand extends Command
{
    private const RANKED_QUEUES = [420, 440];

    /** @var string SQL for role-level aggregates (champion_id and opponent_champion_id null) */
    private const SQL_ROLE_LEVEL = <<<'SQL'
SELECT p.region, m.queue_id, p.tier, p.rank, p.team_position,
  NULL::int AS champion_id, NULL::int AS opponent_champion_id,
  COUNT(*)::int AS sample_size,
  AVG(p.cs_per_min) AS cs_per_min_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.cs_per_min) AS cs_per_min_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.cs_per_min) AS cs_per_min_p75,
  AVG(p.damage_per_min) AS damage_per_min_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.damage_per_min) AS damage_per_min_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.damage_per_min) AS damage_per_min_p75,
  AVG(p.vision_score) AS vision_score_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.vision_score) AS vision_score_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.vision_score) AS vision_score_p75,
  AVG(p.gold_per_min) AS gold_per_min_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.gold_per_min) AS gold_per_min_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.gold_per_min) AS gold_per_min_p75,
  AVG(p.kill_participation) AS kill_participation_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.kill_participation) AS kill_participation_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.kill_participation) AS kill_participation_p75,
  AVG(p.deaths) AS deaths_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.deaths) AS deaths_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.deaths) AS deaths_p75
FROM sample_match_participant p
JOIN sample_match m ON p.match_id = m.match_id AND p.region = m.region
WHERE m.queue_id IN (420, 440) AND p.tier IS NOT NULL AND p.rank IS NOT NULL {:regionFilter}
GROUP BY p.region, m.queue_id, p.tier, p.rank, p.team_position
SQL;

    /** @var string SQL for matchup-level (with champion_id, opponent_champion_id, HAVING count >= :minSample) */
    private const SQL_MATCHUP_LEVEL = <<<'SQL'
SELECT p.region, m.queue_id, p.tier, p.rank, p.team_position,
  p.champion_id, p.opponent_champion_id,
  COUNT(*)::int AS sample_size,
  AVG(p.cs_per_min) AS cs_per_min_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.cs_per_min) AS cs_per_min_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.cs_per_min) AS cs_per_min_p75,
  AVG(p.damage_per_min) AS damage_per_min_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.damage_per_min) AS damage_per_min_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.damage_per_min) AS damage_per_min_p75,
  AVG(p.vision_score) AS vision_score_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.vision_score) AS vision_score_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.vision_score) AS vision_score_p75,
  AVG(p.gold_per_min) AS gold_per_min_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.gold_per_min) AS gold_per_min_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.gold_per_min) AS gold_per_min_p75,
  AVG(p.kill_participation) AS kill_participation_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.kill_participation) AS kill_participation_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.kill_participation) AS kill_participation_p75,
  AVG(p.deaths) AS deaths_avg,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY p.deaths) AS deaths_p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY p.deaths) AS deaths_p75
FROM sample_match_participant p
JOIN sample_match m ON p.match_id = m.match_id AND p.region = m.region
WHERE m.queue_id IN (420, 440) AND p.tier IS NOT NULL AND p.rank IS NOT NULL
  AND p.champion_id IS NOT NULL AND p.opponent_champion_id IS NOT NULL {:regionFilter}
GROUP BY p.region, m.queue_id, p.tier, p.rank, p.team_position, p.champion_id, p.opponent_champion_id
HAVING COUNT(*) >= :minSample
SQL;

    public function __construct(
        private readonly Connection $connection,
        private readonly EloBenchmarkRepository $benchmarkRepository,
        private readonly EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('region', null, InputOption::VALUE_OPTIONAL, 'Only aggregate this region (e.g. BR1); omit for all')
            ->addOption('min-matchup-sample', null, InputOption::VALUE_OPTIONAL, 'Min samples to emit a matchup-level benchmark', '10');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $regionFilter = $input->getOption('region');
        $minMatchupSample = (int) $input->getOption('min-matchup-sample');

        $io->title('Aggregate elo benchmarks');
        $io->writeln('Ranked queues: ' . implode(', ', self::RANKED_QUEUES));
        if ($regionFilter !== null && $regionFilter !== '') {
            $io->writeln('Region filter: ' . $regionFilter);
        } else {
            $io->writeln('Region filter: all');
        }
        $io->writeln('Min matchup sample: ' . $minMatchupSample);

        $count = 0;
        $regionFilterSql = ($regionFilter !== null && $regionFilter !== '') ? 'AND p.region = :region' : '';
        $params = $regionFilter !== null && $regionFilter !== '' ? ['region' => $regionFilter] : [];
        $types = $regionFilter !== null && $regionFilter !== '' ? ['region' => \PDO::PARAM_STR] : [];

        // Role-level
        $sql = str_replace('{:regionFilter}', $regionFilterSql, self::SQL_ROLE_LEVEL);
        $stmt = $this->connection->executeQuery($sql, $params, $types);
        while (($row = $stmt->fetchAssociative()) !== false) {
            $this->upsertBenchmarkRow($row);
            $count++;
        }

        // Matchup-level
        $paramsMatchup = ['minSample' => $minMatchupSample];
        $typesMatchup = ['minSample' => \PDO::PARAM_INT];
        if ($regionFilter !== null && $regionFilter !== '') {
            $paramsMatchup['region'] = $regionFilter;
            $typesMatchup['region'] = \PDO::PARAM_STR;
        }
        $sqlMatchup = str_replace('{:regionFilter}', $regionFilterSql, self::SQL_MATCHUP_LEVEL);
        $stmt = $this->connection->executeQuery($sqlMatchup, $paramsMatchup, $typesMatchup);
        while (($row = $stmt->fetchAssociative()) !== false) {
            $this->upsertBenchmarkRow($row);
            $count++;
        }

        $this->em->flush();
        $io->success('Aggregated ' . $count . ' benchmark row(s).');
        return Command::SUCCESS;
    }

    /**
     * @param array<string, mixed> $row
     */
    private function upsertBenchmarkRow(array $row): void
    {
        $region = (string) $row['region'];
        $queueId = (int) $row['queue_id'];
        $tier = (string) $row['tier'];
        $rank = (string) $row['rank'];
        $teamPosition = (string) $row['team_position'];
        $championId = isset($row['champion_id']) && $row['champion_id'] !== null ? (int) $row['champion_id'] : null;
        $opponentChampionId = isset($row['opponent_champion_id']) && $row['opponent_champion_id'] !== null ? (int) $row['opponent_champion_id'] : null;

        $benchmark = $this->benchmarkRepository->findOneByKeys($region, $queueId, $tier, $rank, $teamPosition, $championId, $opponentChampionId);
        if ($benchmark === null) {
            $benchmark = new EloBenchmark();
            $benchmark->setRegion($region);
            $benchmark->setQueueId($queueId);
            $benchmark->setTier($tier);
            $benchmark->setRank($rank);
            $benchmark->setTeamPosition($teamPosition);
            $benchmark->setChampionId($championId);
            $benchmark->setOpponentChampionId($opponentChampionId);
            $this->em->persist($benchmark);
        }

        $benchmark->setSampleSize((int) $row['sample_size']);
        $benchmark->setCsPerMinAvg($this->float($row['cs_per_min_avg']));
        $benchmark->setCsPerMinP50($this->float($row['cs_per_min_p50']));
        $benchmark->setCsPerMinP75($this->float($row['cs_per_min_p75']));
        $benchmark->setDamagePerMinAvg($this->float($row['damage_per_min_avg']));
        $benchmark->setDamagePerMinP50($this->float($row['damage_per_min_p50']));
        $benchmark->setDamagePerMinP75($this->float($row['damage_per_min_p75']));
        $benchmark->setVisionScoreAvg($this->float($row['vision_score_avg']));
        $benchmark->setVisionScoreP50($this->float($row['vision_score_p50']));
        $benchmark->setVisionScoreP75($this->float($row['vision_score_p75']));
        $benchmark->setGoldPerMinAvg($this->float($row['gold_per_min_avg']));
        $benchmark->setGoldPerMinP50($this->float($row['gold_per_min_p50']));
        $benchmark->setGoldPerMinP75($this->float($row['gold_per_min_p75']));
        $benchmark->setKillParticipationAvg($this->float($row['kill_participation_avg']));
        $benchmark->setKillParticipationP50($this->float($row['kill_participation_p50']));
        $benchmark->setKillParticipationP75($this->float($row['kill_participation_p75']));
        $benchmark->setDeathsAvg($this->float($row['deaths_avg']));
        $benchmark->setDeathsP50($this->float($row['deaths_p50']));
        $benchmark->setDeathsP75($this->float($row['deaths_p75']));
        $benchmark->setUpdatedAt(new \DateTimeImmutable());
    }

    private function float(mixed $v): ?float
    {
        if ($v === null) {
            return null;
        }
        return round((float) $v, 4);
    }
}
