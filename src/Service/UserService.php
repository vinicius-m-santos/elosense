<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\S3Service;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class UserService
{
    private LoggerInterface $logger;
    private UserRepository $userRepository;

    public function __construct(
        LoggerInterface $logger,
        UserRepository $userRepository,
        private EntityManagerInterface $em,
        private readonly S3Service $s3Service
    ) {
        $this->logger = $logger;
        $this->userRepository = $userRepository;
    }

    public function add(User $user, bool $flush = true): void
    {
        $this->userRepository->add($user, $flush);
    }

    public function get(int $id): ?User
    {
        return $this->userRepository->findById($id);
    }

    public function saveUserProfileImage(File $file, User $user): string
    {
        $clientOriginalName = trim($file->getClientOriginalName() ?? '');

        if (empty($clientOriginalName)) {
            throw new UnprocessableEntityHttpException('Nome de arquivo inválido');
        }

        $filename = sprintf('%s-%s', uniqid(), $clientOriginalName);
        $filePath = sprintf('%s/users/%s/%s', $user->getUuid(), $user->getId(), $filename);

        $this->s3Service->saveFile($file, $filePath);

        $key = $user->getAvatarKey();
        if (!empty($key)) {
            $this->s3Service->deleteObject($key);
        }

        $user->setAvatarKey($filePath);
        $this->add($user);

        $url = $this->s3Service->generateFileUrl($filePath) ?? '';
        if (empty($url)) {
            throw new UnprocessableEntityHttpException('Erro ao salvar imagem');
        }

        return $url;
    }

    public function send(string $to, string $subject, string $message): void
    {
        // Just log for this example
        $this->logger->info("Sending email to $to: $subject - $message");

        // In real use, integrate with MailerInterface
    }

    public function softDelete(User $user): void
    {
        $user->setDeletedAt(new \DateTimeImmutable());
        $this->add($user);
    }
}
