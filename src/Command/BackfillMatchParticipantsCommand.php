<?php

namespace App\Command;

use App\Repository\SampleMatchParticipantRepository;
use App\Repository\SampleMatchRepository;
use App\Service\SampleMatchStorageService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:scraper:backfill-match-participants',
    description: 'Backfill sample_match_participant for matches that have fewer than 10 participants (no match API calls, uses stored payload + league-by-puuid)',
)]
final class BackfillMatchParticipantsCommand extends Command
{
    public function __construct(
        private readonly SampleMatchRepository $sampleMatchRepository,
        private readonly SampleMatchParticipantRepository $sampleMatchParticipantRepository,
        private readonly SampleMatchStorageService $sampleStorage,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('region', null, InputOption::VALUE_OPTIONAL, 'Only process this region (e.g. BR1); omit for all regions')
            ->addOption('limit', null, InputOption::VALUE_OPTIONAL, 'Max number of matches to process per run (0 = no limit)', '0')
            ->addOption('retry-after', null, InputOption::VALUE_OPTIONAL, 'Seconds to wait on 429 when Retry-After header is missing', '130');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $region = $input->getOption('region');
        $region = $region !== null && $region !== '' ? strtoupper((string) $region) : null;
        $limit = (int) $input->getOption('limit');
        $retryAfterDefault = (int) $input->getOption('retry-after');
        if ($retryAfterDefault < 1) {
            $retryAfterDefault = 45;
        }
        if ($retryAfterDefault > 300) {
            $retryAfterDefault = 300;
        }

        $io->title('Backfill match participants');
        $io->writeln('Region: ' . ($region ?? 'all'));
        $io->writeln('Limit: ' . ($limit <= 0 ? 'no limit' : (string) $limit));
        $io->writeln('Retry-after (429): ' . $retryAfterDefault . 's');

        $pairs = $this->sampleMatchRepository->findMatchIdsAndRegionsWithFewerThanTenParticipants($region, $limit <= 0 ? 0 : $limit);
        $total = \count($pairs);
        if ($total === 0) {
            $io->success('No incomplete matches found. Nothing to do.');
            return Command::SUCCESS;
        }

        $io->writeln('Found ' . $total . ' match(es) with fewer than 10 participants.');
        $processed = 0;
        $errors = 0;

        foreach ($pairs as $idx => $pair) {
            $matchId = $pair['match_id'];
            $regionStr = $pair['region'];
            $platform = strtolower($regionStr);

            $sampleMatch = $this->sampleMatchRepository->findByMatchIdAndRegion($matchId, $regionStr);
            if (!$sampleMatch) {
                $io->writeln("  <comment>Match {$matchId} / {$regionStr} not found in sample_match, skip.</comment>");
                $errors++;
                continue;
            }

            $payload = $sampleMatch->getPayload();
            if ($payload === []) {
                $io->writeln("  <comment>Match {$matchId} / {$regionStr} has empty payload, skip.</comment>");
                $errors++;
                continue;
            }

            $existingParticipant = $this->sampleMatchParticipantRepository->findOneBy([
                'matchId' => $matchId,
                'region' => $regionStr,
            ]);
            if (!$existingParticipant) {
                $io->writeln("  <comment>Match {$matchId} / {$regionStr} has no participant row, skip.</comment>");
                $errors++;
                continue;
            }

            $puuid = $existingParticipant->getPuuid();
            $tier = $existingParticipant->getTier();
            $rank = $existingParticipant->getRank();

            try {
                $this->runWith429Retry($io, function () use ($payload, $regionStr, $puuid, $tier, $rank, $platform): void {
                    $this->sampleStorage->persistParticipantsFromPayload($payload, $regionStr, $puuid, $tier, $rank, $platform);
                }, 'BackfillMatch', $retryAfterDefault);
                $processed++;
                if (($idx + 1) % 50 === 0 || $idx === $total - 1) {
                    $io->writeln('  Processed ' . ($idx + 1) . ' / ' . $total . ' matches.');
                }
            } catch (\Throwable $e) {
                $io->writeln("  <comment>Error match {$matchId} / {$regionStr}: " . $e->getMessage() . '</comment>');
                $errors++;
            }
        }

        $io->success("Backfill concluído: {$processed} partidas processadas." . ($errors > 0 ? " {$errors} partida(s) com erro ou ignorada(s)." : ''));
        return Command::SUCCESS;
    }

    /**
     * Run a callable; on HTTP 429 sleep using Retry-After header (or defaultSeconds) then retry once.
     *
     * @param callable(): void $fn
     */
    private function runWith429Retry(SymfonyStyle $io, callable $fn, string $label, int $defaultSeconds = 45): void
    {
        $last = null;
        for ($attempt = 0; $attempt < 2; $attempt++) {
            try {
                $fn();
                return;
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
}
