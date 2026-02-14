<?php

namespace App\Command;

use App\Repository\SamplePlayerRepository;
use App\Service\RiotApiService;
use App\Service\RiotApiThrottler;
use App\Service\SampleMatchStorageService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpKernel\KernelInterface;

#[AsCommand(
    name: 'app:scraper:ranked-sample',
    description: 'Scrape ranked match sample by tier+rank for a region (throttled, retries on 429)',
)]
final class ScraperRankedSampleCommand extends Command
{
    private const QUEUE_MAP = [
        420 => 'RANKED_SOLO_5x5',
        440 => 'RANKED_FLEX_SR',
    ];

    private const TIER_ORDER = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    private const RANK_ORDER = ['IV', 'III', 'II', 'I'];

    public function __construct(
        private readonly RiotApiService $riotApi,
        private readonly RiotApiThrottler $throttler,
        private readonly SampleMatchStorageService $sampleStorage,
        private readonly SamplePlayerRepository $samplePlayerRepository,
        private readonly KernelInterface $kernel,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('region', 'r', InputOption::VALUE_REQUIRED, 'Platform/region (e.g. BR1, NA1, KR)')
            ->addOption('queue', null, InputOption::VALUE_OPTIONAL, 'Queue: 420 (Solo) or 440 (Flex)', '420')
            ->addOption('players-per-stratum', null, InputOption::VALUE_OPTIONAL, 'Players to sample per tier+rank', '20')
            ->addOption('matches-per-player', null, InputOption::VALUE_OPTIONAL, 'Match IDs to fetch per player', '5')
            ->addOption('seed', null, InputOption::VALUE_OPTIONAL, 'Random seed for reproducible sampling (optional)')
            ->addOption('no-resume', null, InputOption::VALUE_NONE, 'Ignore saved state and start from the beginning')
            ->addOption('retry-after', null, InputOption::VALUE_OPTIONAL, 'Seconds to wait on 429 when Retry-After header is missing (default 45, use lower to test)', '45');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $region = strtoupper((string) $input->getOption('region'));
        $queueOpt = (string) $input->getOption('queue');
        $queueId = (int) $queueOpt;
        $queueName = self::QUEUE_MAP[$queueId] ?? 'RANKED_SOLO_5x5';
        if (!isset(self::QUEUE_MAP[$queueId])) {
            $queueId = 420;
        }
        $playersPerStratum = (int) $input->getOption('players-per-stratum');
        $matchesPerPlayer = (int) $input->getOption('matches-per-player');
        $seed = $input->getOption('seed');
        $noResume = $input->getOption('no-resume');
        $retryAfterDefault = (int) $input->getOption('retry-after');
        if ($retryAfterDefault < 1) {
            $retryAfterDefault = 45;
        }
        if ($retryAfterDefault > 300) {
            $retryAfterDefault = 300;
        }

        if ($region === '') {
            $io->error('Option --region is required (e.g. BR1, NA1, KR).');
            return Command::FAILURE;
        }

        $platform = strtolower($region);
        $stateFile = $this->kernel->getProjectDir() . '/var/scraper_state_' . $platform . '_' . $queueId . '.json';
        $state = $noResume ? null : $this->loadState($stateFile);
        $strata = $this->buildStrata();
        $startIndex = $this->findStartIndex($strata, $state);

        $io->title('Ranked sample scraper');
        $io->table([], [
            ['Region', $region],
            ['Queue', $queueName . ' (' . $queueId . ')'],
            ['Players per stratum', (string) $playersPerStratum],
            ['Matches per player', (string) $matchesPerPlayer],
            ['Seed', $seed !== null ? $seed : 'none (first N)'],
            ['Resume', $noResume ? 'no' : ($state ? 'yes' : 'no')],
            ['Strata total', (string) \count($strata)],
            ['Starting at stratum', $startIndex + 1 . ' / ' . \count($strata)],
        ]);

        if ($startIndex >= \count($strata)) {
            $io->success('All strata already completed for this region/queue. Nothing to do. Use --no-resume to start from the beginning.');
            return Command::SUCCESS;
        }

        $totalNewMatches = 0;
        $totalPlayers = 0;

        for ($i = $startIndex; $i < \count($strata); $i++) {
            [$tier, $rank] = $strata[$i];
            $tierRankLabel = $rank !== null ? $tier . ' ' . $rank : $tier;
            $io->section('Stratum: ' . $tierRankLabel);

            $this->throttler->waitIfNeeded();
            $entries = $this->fetchEntries($platform, $queueName, $tier, $rank);
            $this->throttler->recordRequest();
            if ($entries === []) {
                $io->writeln('  No entries.');
                $this->saveState($stateFile, $tier, $rank);
                continue;
            }

            $sampled = $this->sampleEntries($entries, $playersPerStratum, $seed !== null ? (int) $seed + $i : null);
            $io->writeln('  Sampled ' . \count($sampled) . ' players.');

            foreach ($sampled as $entry) {
                $entryArr = \is_array($entry) ? $entry : (array) $entry;
                $entryTier = $entryArr['tier'] ?? $tier;
                $entryRank = $entryArr['rank'] ?? ($rank ?? 'I');
                $queueType = $entryArr['queueType'] ?? $queueName;

                $puuid = $this->getPuuidFromEntry($entryArr);
                if ($puuid === null || $puuid === '') {
                    $summonerId = $this->getSummonerIdFromEntry($entryArr);
                    if ($summonerId !== null && $summonerId !== '') {
                        $this->throttler->waitIfNeeded();
                        try {
                            $summoner = $this->riotApi->getSummonerBySummonerId($platform, $summonerId);
                            $puuid = $summoner['puuid'] ?? null;
                        } catch (\Throwable $e) {
                            $io->writeln('  <comment>Summoner error: ' . $e->getMessage() . '</comment>');
                            $this->throttler->recordRequest();
                        }
                        if ($puuid !== null) {
                            $this->throttler->recordRequest();
                        }
                    }
                }
                if ($puuid === null || $puuid === '') {
                    continue;
                }

                $this->samplePlayerRepository->upsert($puuid, $region, $entryTier, $entryRank, $queueType);
                $this->samplePlayerRepository->getEntityManager()->flush();
                $totalPlayers++;

                $this->throttler->waitIfNeeded();
                try {
                    $matchIds = $this->runWith429Retry($io, fn () => $this->riotApi->getMatchIdsByPuuid($puuid, $matchesPerPlayer, $platform), 'MatchIds', $retryAfterDefault);
                } catch (\Throwable $e) {
                    $io->writeln('  <comment>MatchIds error: ' . $e->getMessage() . '</comment>');
                    $this->throttler->recordRequest();
                    continue;
                }
                $this->throttler->recordRequest();

                $newInStratum = 0;
                foreach ($matchIds as $matchId) {
                    if ($this->sampleStorage->matchExistsInSample($matchId, $region)) {
                        continue;
                    }
                    $this->throttler->waitIfNeeded();
                    try {
                        $matchPayload = $this->runWith429Retry($io, fn () => $this->riotApi->getMatchById($matchId, $platform), 'Match', $retryAfterDefault);
                    } catch (\Throwable $e) {
                        $this->throttler->recordRequest();
                        continue;
                    }
                    $this->throttler->recordRequest();

                    $this->sampleStorage->persistMatchPayload($matchPayload, $region, $puuid, $entryTier, $entryRank);
                    $totalNewMatches++;
                    $newInStratum++;
                }
                if ($newInStratum > 0) {
                    $io->writeln('  Player ' . $puuid . ': ' . $newInStratum . ' new match(es).');
                }
            }

            $io->writeln('  Stratum done. Total new matches so far: ' . $totalNewMatches . '.');
            $this->saveState($stateFile, $tier, $rank);
        }

        $io->success('Scraper finished. Total new matches: ' . $totalNewMatches . ', players touched: ' . $totalPlayers . '.');
        return Command::SUCCESS;
    }

    /**
     * @return list<array{0: string, 1: string|null}> [(tier, rank), ...] from IRON IV to CHALLENGER
     */
    private function buildStrata(): array
    {
        $strata = [];
        foreach (self::TIER_ORDER as $tier) {
            if (\in_array($tier, ['MASTER', 'GRANDMASTER', 'CHALLENGER'], true)) {
                $strata[] = [$tier, null];
                continue;
            }
            foreach (self::RANK_ORDER as $rank) {
                $strata[] = [$tier, $rank];
            }
        }
        return $strata;
    }

    /**
     * @return array<int, array{summonerId?: string, summoner_id?: string, tier?: string, rank?: string, queueType?: string, ...}>
     */
    private function fetchEntries(string $platform, string $queue, string $tier, ?string $rank): array
    {
        if ($rank !== null) {
            $list = $this->riotApi->getLeagueEntries($platform, $queue, $tier, $rank, 1);
            return $this->normalizeLeagueEntriesList($list);
        }
        if ($tier === 'MASTER') {
            $data = $this->riotApi->getMasterLeague($platform, $queue);
            return $this->normalizeLeagueEntriesList($data['entries'] ?? []);
        }
        if ($tier === 'GRANDMASTER') {
            $data = $this->riotApi->getGrandmasterLeague($platform, $queue);
            return $this->normalizeLeagueEntriesList($data['entries'] ?? []);
        }
        if ($tier === 'CHALLENGER') {
            $data = $this->riotApi->getChallengerLeague($platform, $queue);
            return $this->normalizeLeagueEntriesList($data['entries'] ?? []);
        }
        return [];
    }

    /**
     * Ensure we have a list of entry objects; unwrap if API returned { "entries": [...] } or similar.
     *
     * @param mixed $list
     * @return array<int, array<string, mixed>>
     */
    private function normalizeLeagueEntriesList(mixed $list): array
    {
        if (!\is_array($list)) {
            return [];
        }
        if (isset($list['entries']) && \is_array($list['entries'])) {
            return array_values($list['entries']);
        }
        if (isset($list['content']) && \is_array($list['content'])) {
            return array_values($list['content']);
        }
        if (isset($list['data']) && \is_array($list['data'])) {
            return array_values($list['data']);
        }
        return array_values($list);
    }

    /**
     * League-v4 entries may return puuid directly (newer) or summonerId (legacy).
     *
     * @param array<string, mixed> $entry
     */
    private function getPuuidFromEntry(array $entry): ?string
    {
        $id = $entry['puuid'] ?? $entry['puuid_id'] ?? null;
        return $id !== null && $id !== '' ? (string) $id : null;
    }

    /**
     * @param array<string, mixed>|object $entry
     */
    private function getSummonerIdFromEntry(array|object $entry): ?string
    {
        $arr = \is_array($entry) ? $entry : (array) $entry;
        $id = $arr['summonerId']
            ?? $arr['summoner_id']
            ?? $arr['encryptedSummonerId']
            ?? $arr['encrypted_summoner_id']
            ?? null;
        return $id !== null && $id !== '' ? (string) $id : null;
    }

    /**
     * @param array<int, array{summonerId: string, ...}> $entries
     * @return array<int, array{summonerId: string, ...}>
     */
    private function sampleEntries(array $entries, int $n, ?int $seed): array
    {
        if ($n >= \count($entries)) {
            return $entries;
        }
        if ($seed !== null) {
            mt_srand($seed);
            $order = range(0, \count($entries) - 1);
            for ($i = \count($order) - 1; $i >= 1; $i--) {
                $j = mt_rand(0, $i);
                [$order[$i], $order[$j]] = [$order[$j], $order[$i]];
            }
            $sampled = [];
            for ($i = 0; $i < $n && $i < \count($order); $i++) {
                $sampled[] = $entries[$order[$i]];
            }
            return $sampled;
        }
        return \array_slice($entries, 0, $n);
    }

    private function findStartIndex(array $strata, ?array $state): int
    {
        if ($state === null) {
            return 0;
        }
        $lastTier = $state['tier'] ?? null;
        $lastRank = $state['rank'] ?? null;
        if ($lastTier === null) {
            return 0;
        }
        foreach ($strata as $idx => [$tier, $rank]) {
            if ($tier === $lastTier && $rank === $lastRank) {
                return $idx + 1;
            }
        }
        return 0;
    }

    /**
     * Run a callable; on HTTP 429 sleep using Retry-After header (or defaultSeconds) then retry once.
     *
     * @template T
     * @param callable(): T $fn
     * @return T
     */
    private function runWith429Retry(SymfonyStyle $io, callable $fn, string $label, int $defaultSeconds = 45): mixed
    {
        $last = null;
        for ($attempt = 0; $attempt < 2; $attempt++) {
            try {
                return $fn();
            } catch (\Throwable $e) {
                $last = $e;
                if ($attempt === 0 && method_exists($e, 'getResponse') && $e->getResponse() !== null) {
                    $response = $e->getResponse();
                    if (method_exists($response, 'getStatusCode') && $response->getStatusCode() === 429) {
                        $seconds = $defaultSeconds;
                        $headers = $response->getHeaders(false);
                        if (isset($headers['retry-after'][0])) {
                            $fromHeader = (int) $headers['retry-after'][0];
                            $seconds = $fromHeader >= 1 && $fromHeader <= 300 ? $fromHeader : $defaultSeconds;
                        }
                        $io->writeln("  <comment>429 Rate limit: waiting {$seconds}s before retry ({$label})...</comment>");
                        sleep($seconds);
                        continue;
                    }
                }
                throw $e;
            }
        }
        throw $last;
    }

    private function loadState(string $path): ?array
    {
        if (!is_readable($path)) {
            return null;
        }
        $json = @file_get_contents($path);
        if ($json === false) {
            return null;
        }
        $data = json_decode($json, true);
        return \is_array($data) ? $data : null;
    }

    private function saveState(string $path, string $tier, ?string $rank): void
    {
        $dir = \dirname($path);
        (new Filesystem())->mkdir($dir);
        file_put_contents($path, json_encode(['tier' => $tier, 'rank' => $rank], JSON_THROW_ON_ERROR));
    }
}
