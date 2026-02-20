<?php

namespace App\Command;

use App\Repository\SampleMatchParticipantRepository;
use App\Service\EmailServiceInterface;
use App\Service\SampleMatchStorageService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:backfill:tier-rank-participants',
    description: 'Backfill tier/rank for sample_match_participant rows with missing tier/rank (ranked queues only). Uses league-by-puuid for the match queue. Improves matchup benchmark N.',
)]
final class BackfillTierRankParticipantsCommand extends Command
{
    public function __construct(
        private readonly SampleMatchParticipantRepository $participantRepository,
        private readonly SampleMatchStorageService $sampleStorage,
        private readonly EntityManagerInterface $em,
        private readonly EmailServiceInterface $emailService,
        private readonly LoggerInterface $logger,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('region', null, InputOption::VALUE_OPTIONAL, 'Only process this region (e.g. BR1); omit for all')
            ->addOption('limit', null, InputOption::VALUE_OPTIONAL, 'Max (puuid, region, queue) groups to process (0 = no limit)', '0')
            ->addOption('retry-after', null, InputOption::VALUE_OPTIONAL, 'Seconds to wait on 429 when Retry-After header is missing', '130')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Only count how many groups would be processed, no API or DB writes')
            ->addOption('notify-email', null, InputOption::VALUE_OPTIONAL, 'Send a notification email when finished (or set BACKFILL_NOTIFY_EMAIL env)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $region = $input->getOption('region');
        $region = $region !== null && $region !== '' ? strtoupper((string) $region) : null;
        $limit = (int) $input->getOption('limit');
        $limit = $limit < 0 ? 0 : $limit;
        $retryAfterDefault = (int) $input->getOption('retry-after');
        $retryAfterDefault = $retryAfterDefault < 1 ? 45 : ($retryAfterDefault > 300 ? 300 : $retryAfterDefault);
        $dryRun = (bool) $input->getOption('dry-run');

        $io->title('Backfill tier/rank for participants (matchup data)');
        $io->writeln('Region: ' . ($region ?? 'all'));
        $io->writeln('Limit: ' . ($limit <= 0 ? 'no limit' : (string) $limit));
        $io->writeln('Retry-after (429): ' . $retryAfterDefault . 's');
        $io->writeln('Dry run: ' . ($dryRun ? 'yes' : 'no'));

        $groups = $this->participantRepository->findDistinctPuuidsWithMissingTierRank($region, $limit <= 0 ? 0 : $limit);
        $total = \count($groups);
        if ($total === 0) {
            $io->success('No participants with missing tier/rank in ranked matches. Nothing to do.');
            return Command::SUCCESS;
        }

        $io->writeln('Found ' . $total . ' (puuid, region, queue) group(s) with missing tier/rank.');
        if ($dryRun) {
            $io->success('Dry run: would process ' . $total . ' group(s). Run without --dry-run to perform backfill.');
            return Command::SUCCESS;
        }

        $processed = 0;
        $updated = 0;
        $errors = 0;
        $rateLimited = 0;

        foreach ($groups as $idx => $row) {
            $puuid = $row['puuid'];
            $regionStr = $row['region'];
            $queueId = $row['queueId'];

            try {
                $this->runWith429Retry($io, function () use ($puuid, $regionStr, $queueId, &$updated): void {
                    [$tier, $rank] = $this->sampleStorage->resolveTierRankForPuuidAndQueueId($puuid, $regionStr, $queueId);
                    $ids = $this->participantRepository->findIdsWithMissingTierRankByPuuidRegionAndQueue($puuid, $regionStr, $queueId);
                    if ($ids !== [] && ($tier !== null || $rank !== null)) {
                        $this->participantRepository->updateTierRankByIds($ids, $tier, $rank);
                        $updated += \count($ids);
                    }
                }, 'LeagueByPuuid', $retryAfterDefault);
                $processed++;
            } catch (\Throwable $e) {
                if (method_exists($e, 'getResponse') && $e->getResponse() !== null && method_exists($e->getResponse(), 'getStatusCode') && $e->getResponse()->getStatusCode() === 429) {
                    $rateLimited++;
                }
                $io->writeln('  <comment>Error ' . substr($puuid, 0, 8) . '… / ' . $regionStr . ' / ' . $queueId . ': ' . $e->getMessage() . '</comment>');
                $errors++;
            }

            $this->em->flush();
            if (($idx + 1) % 50 === 0 || $idx === $total - 1) {
                $io->writeln('  Processed ' . ($idx + 1) . ' / ' . $total . ' groups, updated ' . $updated . ' participant row(s).');
            }
        }

        $msg = "Backfill concluído: {$processed} grupo(s) processado(s), {$updated} linha(s) de participante atualizada(s).";
        if ($errors > 0) {
            $msg .= " {$errors} erro(s).";
        }
        if ($rateLimited > 0) {
            $msg .= " {$rateLimited} 429 (rate limit).";
        }
        $io->success($msg);

        $notifyEmail = $input->getOption('notify-email') ?: ($_ENV['BACKFILL_NOTIFY_EMAIL'] ?? null);
        if ($notifyEmail !== null && $notifyEmail !== '' && filter_var($notifyEmail, FILTER_VALIDATE_EMAIL)) {
            try {
                $body = "Backfill tier/rank (participantes) finalizou.\n\n";
                $body .= "Resumo: {$processed} grupo(s) processado(s), {$updated} linha(s) de participante atualizada(s).\n";
                if ($errors > 0) {
                    $body .= "{$errors} erro(s).\n";
                }
                if ($rateLimited > 0) {
                    $body .= "{$rateLimited} 429 (rate limit).\n";
                }
                $body .= "\nPode iniciar o scraper novamente.";
                $this->emailService->sendEmail(
                    $notifyEmail,
                    '[Elosense] Backfill tier/rank concluído – pode iniciar o scraper',
                    $body,
                );
                $io->writeln('Email de notificação enviado para ' . $notifyEmail);
            } catch (\Throwable $e) {
                $this->logger->warning('Falha ao enviar email de notificação do backfill: ' . $e->getMessage());
                $io->writeln('  <comment>Não foi possível enviar o email de notificação: ' . $e->getMessage() . '</comment>');
            }
        }

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
