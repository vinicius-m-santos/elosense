<?php

namespace App\Service;

use Aws\Result;
use Aws\S3\S3Client;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Armazena e recupera arquivos (avatar, etc.) no Amazon S3.
 * Requer que o bucket definido em AWS_BUCKET já exista na região AWS_REGION.
 * Se aparecer "NoSuchBucket": crie o bucket no console AWS S3 (mesma região do .env).
 */
class S3Service
{
    private S3Client $s3Client;
    private const ALLOWED_MIME_TYPES = [
        'jpeg',
        'jpg',
        'png',
        'webp',
        'gif'
    ];
    private const ALLOWED_FILE_MAX_SIZE = 5000000;
    private const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov'];
    private const ALLOWED_VIDEO_MAX_SIZE = 15728640;

    public function __construct(
        private readonly LoggerInterface $logger
    )
    {
        $this->s3Client = new S3Client([
            'version' => 'latest',
            'region' => $_ENV['AWS_REGION'],
            'credentials' => [
                'key' => $_ENV['AWS_ACCESS_KEY_ID'],
                'secret' => $_ENV['AWS_SECRET_ACCESS_KEY']
            ]
        ]);
    }
    
    public function saveFile(File $file, string $filePath): Result
    {
        if ($this->checkIfFileTypeIsAllowed($file->guessExtension()) === false) {
            throw new UnprocessableEntityHttpException('Tipo de arquivo inválido');
        }

        if ($this->checkIfFileSizeIsAllowed($file->getSize()) === false) {
            throw new UnprocessableEntityHttpException('Arquivo deve ser menor que 5mb');
        }

        return $this->putObject([
            'Bucket' => $_ENV['AWS_BUCKET'],
            'Key' => $filePath,
            'SourceFile' => $file->getPathname()
        ]);
    }

    public function saveVideoFile(File $file, string $filePath): Result
    {
        $extension = strtolower($file->guessExtension() ?? '');
        if (!in_array($extension, self::ALLOWED_VIDEO_EXTENSIONS, true)) {
            throw new UnprocessableEntityHttpException('Formato de vídeo inválido. Use MP4, WebM ou MOV.');
        }
        if ($file->getSize() > self::ALLOWED_VIDEO_MAX_SIZE) {
            throw new UnprocessableEntityHttpException('O vídeo deve ter no máximo 15MB.');
        }
        return $this->putObject([
            'Bucket' => $_ENV['AWS_BUCKET'],
            'Key' => $filePath,
            'SourceFile' => $file->getPathname()
        ]);
    }

    private function checkIfFileSizeIsAllowed(int $size): bool
    {
        return !($size > self::ALLOWED_FILE_MAX_SIZE);
    }

    private function checkIfFileTypeIsAllowed(string $mimeType): bool
    {
        return in_array($mimeType, self::ALLOWED_MIME_TYPES);
    }

    private function putObject(array $data): Result
    {
        return $this->s3Client->putObject($data);
    }

    public function getObjectUrl($filePath)
    {
        return $this->s3Client->getObjectUrl($_ENV['AWS_BUCKET'], $filePath);
    }

    public function generateFileUrl(string $key): string
    {
        if (empty($key)) {
            return $key;
        }

        $cmd = $this->s3Client->getCommand('GetObject', [
            'Bucket' => $_ENV['AWS_BUCKET'],
            'Key' => $key,
        ]);

        $request = $this->s3Client->createPresignedRequest($cmd, '+1 hour');

        return (string) $request->getUri();
    }

    public function deleteObject(string $key): void
    {
        $this->s3Client->deleteObject(
            [
                'Bucket' => $_ENV['AWS_BUCKET'],
                'Key' => $key
            ]
        );
    }

    public function getObjectBody(string $key): ?\Psr\Http\Message\StreamInterface
    {
        try {
            $result = $this->s3Client->getObject([
                'Bucket' => $_ENV['AWS_BUCKET'],
                'Key' => $key,
            ]);
            return $result['Body'] ?? null;
        } catch (\Throwable $e) {
            $this->logger->warning('S3 getObject failed: ' . $e->getMessage());
            return null;
        }
    }

    public function getObjectContentType(string $key): ?string
    {
        try {
            $result = $this->s3Client->headObject([
                'Bucket' => $_ENV['AWS_BUCKET'],
                'Key' => $key,
            ]);
            return $result['ContentType'] ?? null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
