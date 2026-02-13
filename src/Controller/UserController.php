<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\ClientRepository;
use App\Repository\UserRepository;
use App\Service\S3Service;
use App\Service\UserService;
use DateTime;
use Exception;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/user', name: 'api_user')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService,
        private readonly UserRepository $userRepository,
        private readonly ClientRepository $clientRepository,
        private readonly NormalizerInterface $normalizer,
        private readonly ValidatorInterface $validator,
        private readonly S3Service $s3Service,
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {}

    #[Route('/check-token/{token}/{client}', name: 'check_user_token', methods: ['GET'])]
    public function checkUserToken(string $token, string $client): JsonResponse
    {
        try {
            $token = trim($token);
            $client = trim($client);
            if (strlen($token) === 0 || strlen($client) === 0) {
                throw new UnprocessableEntityHttpException('Link inválido');
            }

            $user = $this->userRepository->findOneBy(['uuid' => $token]);
            if ($user === null) {
                throw new UnprocessableEntityHttpException('Link inválido');
            }

            $client = $this->clientRepository->findOneBy(['uuid' => $client]);
            if ($client === null) {
                throw new UnprocessableEntityHttpException('Link inválido');
            }

            $normalizedData = $this->normalizer->normalize($client, 'json', ['groups' => ['client_all']]);
            return new JsonResponse(['data' => $normalizedData], 200);
        } catch (Exception $e) {
            throw new UnprocessableEntityHttpException('Erro ao carregar página');
        }
    }

    // #[Route('/update', name: 'update_user', methods: ['PUT'])]
    // public function update(Request $request): JsonResponse
    // {
    //     $user = $this->getUser();

    //     if (!$user) {
    //         return new JsonResponse(['error' => 'Unauthorized'], 401);
    //     }

    //     $data = json_decode($request->getContent(), true);

    //     $convertedDob = $user->getDob() ?? null;
    //     if (isset($data['dob'])) {
    //         $convertedDob = \DateTime::createFromFormat('Y-m-d', $data['dob']) ?: null;
    //     }

    //     $user->setFirstName($data['firstName']);
    //     $user->setLastName($data['lastName']);
    //     $user->setDob($convertedDob);
    //     $user->setEmail($data['email']);
    //     $user->setCpf($data['cpf']);
    //     $user->setPhoneNumber($data['phoneNumber']);
    //     $user->setState($data['state']);
    //     $user->setCity($data['city']);

    //     $this->userService->add($user);

    //     return new JsonResponse(['status' => 'User Updated'], 200);
    // }

    #[Route('/avatar/{id}', name: 'user_upload_avatar', methods: ['POST'])]
    public function uploadAvatar(Request $request, User $user): JsonResponse
    {
        $file = $request->files->get('avatar');
        if (!$file) {
            throw new UnprocessableEntityHttpException('Arquivo não enviado');
        }

        $currentUser = $this->getUser();
        if (!$currentUser || $currentUser->getId() !== $user->getId()) {
            throw new UnprocessableEntityHttpException('Erro ao realizar upload');
        }

        $url = $this->userService->saveUserProfileImage($file, $user);
        return new JsonResponse(['data' => $url]);
    }

    #[Route('/avatar/{id}', name: 'user_get_avatar', methods: ['GET'])]
    public function getAvatar(User $user): StreamedResponse|NotFoundHttpException
    {
        $this->getUser();
        $key = $user->getAvatarKey();
        if (empty($key)) {
            throw new NotFoundHttpException('Avatar não encontrado');
        }
        $body = $this->s3Service->getObjectBody($key);
        if ($body === null) {
            throw new NotFoundHttpException('Avatar não encontrado');
        }
        $contentType = $this->s3Service->getObjectContentType($key) ?? 'image/jpeg';
        $response = new StreamedResponse(function () use ($body) {
            while (!$body->eof()) {
                echo $body->read(8192);
            }
        });
        $response->headers->set('Content-Type', $contentType);
        $response->headers->set('Cache-Control', 'private, max-age=3600');
        return $response;
    }

    #[Route('/avatar/{id}', name: 'user_delete_avatar', methods: ['DELETE'])]
    public function deleteAvatar(User $user): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser || $currentUser->getId() !== $user->getId()) {
            throw new UnprocessableEntityHttpException('Não autorizado');
        }

        $key = $user->getAvatarKey();
        if (!empty($key)) {
            $this->s3Service->deleteObject($key);
        }

        $user->setAvatarKey(null);
        $user->setAvatarUrl(null);
        $this->userService->add($user);

        return new JsonResponse(['data' => 'Sucesso']);
    }

    #[Route('/{id}/change-password', name: 'user_change_password', methods: ['POST'])]
    public function changePassword(Request $request, User $user): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser || $currentUser->getId() !== $user->getId()) {
            throw new UnprocessableEntityHttpException('Não autorizado');
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['currentPassword']) || !isset($data['newPassword'])) {
            throw new UnprocessableEntityHttpException('Dados inválidos');
        }

        if (!$this->passwordHasher->isPasswordValid($user, $data['currentPassword'])) {
            throw new UnprocessableEntityHttpException('Senha atual incorreta');
        }

        $hashedPassword = $this->passwordHasher->hashPassword($user, $data['newPassword']);
        $user->setPassword($hashedPassword);
        $this->userService->add($user);

        return new JsonResponse(['data' => 'Senha alterada com sucesso']);
    }

    #[Route('/{id}', name: 'user_update', methods: ['PATCH'])]
    public function update(Request $request, User $user): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser || $currentUser->getId() !== $user->getId()) {
            throw new UnprocessableEntityHttpException('Não autorizado');
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new UnprocessableEntityHttpException('Erro ao atualizar usuário');
        }

        unset($data['email']);

        if (isset($data['firstName'])) {
            $user->setFirstName($data['firstName']);
        }

        if (isset($data['lastName'])) {
            $user->setLastName($data['lastName']);
        }

        if (isset($data['phone'])) {
            $user->setPhone($data['phone']);
        }

        if (isset($data['birthDate'])) {
            $birthDate = $data['birthDate'] ? \DateTimeImmutable::createFromFormat('Y-m-d', $data['birthDate']) : null;
            $user->setBirthDate($birthDate);
        }

        if (isset($data['avatarUrl'])) {
            $user->setAvatarUrl($data['avatarUrl']);
        }

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $errorMessage = null;
            foreach ($errors as $error) {
                $errorMessage = $error->getMessage();
                break;
            }

            throw new Exception($errorMessage, 400);
        }

        $avatarKey = $user->getAvatarKey();
        if (isset($avatarKey)) {
            $user->setAvatarUrl($this->s3Service->generateFileUrl($avatarKey));
        }

        $this->userService->add($user);

        $normalizedData = $this->normalizer->normalize($user, 'json', ['groups' => ['user_all']]);
        return new JsonResponse(['data' => $normalizedData]);
    }

    #[Route('/{id}/preferences', name: 'user_update_preferences', methods: ['PATCH'])]
    public function updatePreferences(Request $request, User $user): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser || $currentUser->getId() !== $user->getId()) {
            throw new UnprocessableEntityHttpException('Não autorizado');
        }

        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new UnprocessableEntityHttpException('Erro ao atualizar preferências');
        }

        if (isset($data['emailNotifications'])) {
            $user->setEmailNotifications((bool)$data['emailNotifications']);
        }

        if (isset($data['appNotifications'])) {
            $user->setAppNotifications((bool)$data['appNotifications']);
        }

        $personal = $user->getPersonal();
        if ($personal !== null && array_key_exists('showPlatformExercises', $data)) {
            $personal->setShowPlatformExercises((bool)$data['showPlatformExercises']);
        }

        $this->userService->add($user);

        $normalizedData = $this->normalizer->normalize($user, 'json', ['groups' => ['user_all']]);
        if ($personal !== null) {
            $normalizedData['personal'] = [
                'id' => $personal->getId(),
                'showPlatformExercises' => $personal->isShowPlatformExercises(),
            ];
        }
        return new JsonResponse(['data' => $normalizedData]);
    }

    #[Route('/{id}', name: 'user_delete', methods: ['DELETE'])]
    public function delete(User $user): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser || $currentUser->getId() !== $user->getId()) {
            throw new UnprocessableEntityHttpException('Não autorizado');
        }

        $this->userService->softDelete($user);

        return new JsonResponse(['data' => 'Conta excluída com sucesso']);
    }

    // #[Route('/getsfdasf', name: 'api_get_userrrr', method: ['GET'])]
    // public function getsss(Request $request): JsonResponse
    // {
    //     // $user = $this->getUser();

    //     // if ($user) {
    //     //     return new JsonResponse(['error' => 'Unauthorized', 401]);
    //     // }

    //     // $data = $this->normalizer->normalize($user, 'json', ['user_all']);
    //     return new JsonResponse(['user' => 'ss'], 200);
    // }
}
