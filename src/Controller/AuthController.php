<?php

namespace App\Controller;

use App\Entity\Personal;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\EmailVerificationService;
use App\Service\GoogleAuthService;
use App\Service\PasswordResetService;
use App\Service\SubscriptionService;
use Doctrine\ORM\EntityManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api')]
class AuthController extends AbstractController
{
    private const REFRESH_TOKEN_TTL = 2592000;

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly ValidatorInterface $validator,
        private readonly EntityManagerInterface $em,
        private readonly EmailVerificationService $emailVerificationService,
        private readonly PasswordResetService $passwordResetService,
        private readonly SubscriptionService $subscriptionService,
        private readonly GoogleAuthService $googleAuthService,
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly RefreshTokenGeneratorInterface $refreshTokenGenerator,
        private readonly RefreshTokenManagerInterface $refreshTokenManager
    ) {}

    #[Route('/auth/google', name: 'auth_google', methods: ['POST'])]
    public function google(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || empty($data['credential'])) {
            throw new UnprocessableEntityHttpException('Credencial Google é obrigatória');
        }

        $payload = $this->googleAuthService->verifyIdToken($data['credential']);
        $googleId = $payload['sub'];
        $email = $payload['email'] ?? null;
        if (!$email) {
            throw new UnprocessableEntityHttpException('Email não disponível na conta Google');
        }

        $user = $this->userRepository->findOneBy(['googleId' => $googleId]);
        if (!$user) {
            $user = $this->userRepository->findOneBy(['email' => $email]);
            if ($user) {
                $user->setGoogleId($googleId);
                if ($user->getAvatarUrl() === null && !empty($payload['picture'])) {
                    $user->setAvatarUrl($payload['picture']);
                }
                $this->em->flush();
            }
        }

        if (!$user) {
            $user = new User();
            $user->setEmail($email);
            $user->setFirstName($payload['given_name'] ?? explode(' ', $payload['name'] ?? 'Usuário')[0] ?? 'Usuário');
            $user->setLastName($payload['family_name'] ?? explode(' ', $payload['name'] ?? '', 2)[1] ?? '');
            $user->setPassword(null);
            $user->setGoogleId($googleId);
            $user->setIsVerified(true);
            $user->setRoles(['ROLE_USER', 'ROLE_PERSONAL']);
            if (!empty($payload['picture'])) {
                $user->setAvatarUrl($payload['picture']);
            }
            $this->em->persist($user);
            $personal = new Personal();
            $personal->setUser($user);
            $this->em->persist($personal);
            $this->subscriptionService->createSubscriptionForNewPersonal($personal);
            $this->em->flush();
        }

        if ($user->getDeletedAt() !== null) {
            throw new UnprocessableEntityHttpException('Esta conta foi excluída e não pode mais fazer login.');
        }
        if (!$user->isVerified()) {
            $user->setIsVerified(true);
            $this->em->flush();
        }

        $token = $this->jwtManager->create($user);
        $refreshTokenModel = $this->refreshTokenGenerator->createForUserWithTtl($user, self::REFRESH_TOKEN_TTL);
        $this->refreshTokenManager->save($refreshTokenModel);

        return new JsonResponse([
            'token' => $token,
            'refresh_token' => $refreshTokenModel->getRefreshToken(),
            'user' => $this->buildUserResponse($user),
            'success' => true,
        ]);
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new UnprocessableEntityHttpException('Dados inválidos');
        }

        if (!isset($data['email']) || !isset($data['password']) || !isset($data['firstName']) || !isset($data['lastName'])) {
            throw new UnprocessableEntityHttpException('Campos obrigatórios: email, senha, nome e sobrenome');
        }

        $existingUser = $this->userRepository->findOneBy(['email' => $data['email']]);
        if ($existingUser) {
            if ($existingUser->hasPassword()) {
                throw new UnprocessableEntityHttpException('Este email já está cadastrado. Faça login ou use a opção de recuperar senha.');
            }
            $hashedPassword = $this->passwordHasher->hashPassword($existingUser, $data['password']);
            $existingUser->setPassword($hashedPassword);
            $existingUser->setFirstName($data['firstName']);
            $existingUser->setLastName($data['lastName']);
            if (isset($data['phone'])) {
                $existingUser->setPhone($data['phone']);
            }
            if (isset($data['birthDate'])) {
                $birthDate = \DateTimeImmutable::createFromFormat('Y-m-d', $data['birthDate']);
                if ($birthDate) {
                    $existingUser->setBirthDate($birthDate);
                }
            }
            $personal = $existingUser->getPersonal();
            if ($personal && isset($data['cref'])) {
                $personal->setCref($data['cref']);
            }
            $this->em->flush();
            return new JsonResponse([
                'success' => true,
                'message' => 'Senha definida com sucesso. Agora você pode entrar com email e senha ou com Google.',
            ], 200);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setFirstName($data['firstName']);
        $user->setLastName($data['lastName']);

        if (isset($data['phone'])) {
            $user->setPhone($data['phone']);
        }

        if (isset($data['birthDate'])) {
            $birthDate = \DateTimeImmutable::createFromFormat('Y-m-d', $data['birthDate']);
            if ($birthDate) {
                $user->setBirthDate($birthDate);
            }
        }

        $hashedPassword = $this->passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        $user->setRoles(['ROLE_USER', 'ROLE_PERSONAL']);

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $errorMessage = null;
            foreach ($errors as $error) {
                $errorMessage = $error->getMessage();
                break;
            }
            throw new UnprocessableEntityHttpException($errorMessage ?: 'Dados inválidos');
        }

        $this->em->persist($user);

        $personal = new Personal();
        $personal->setUser($user);

        if (isset($data['cref'])) {
            $personal->setCref($data['cref']);
        }

        $this->em->persist($personal);
        $this->subscriptionService->createSubscriptionForNewPersonal($personal);
        $this->em->flush();

        try {
            $this->emailVerificationService->sendVerificationEmail($user);
        } catch (\Exception $e) {
            error_log('Erro ao enviar email de verificação: ' . $e->getMessage());
        }

        return new JsonResponse([
            'success' => true,
            'message' => 'Cadastro realizado com sucesso. Verifique seu email para ativar sua conta.'
        ], 201);
    }

    private function buildUserResponse(User $user): array
    {
        $response = [
            'id' => $user->getId(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'email' => $user->getUserIdentifier(),
            'roles' => $user->getRoles(),
            'uuid' => $user->getUuid(),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            'phone' => $user->getPhone(),
            'emailNotifications' => $user->isEmailNotifications(),
            'appNotifications' => $user->isAppNotifications(),
            'birthDate' => $user->getBirthDate() ? $user->getBirthDate()->format('Y-m-d') : null,
            'isVerified' => $user->isVerified(),
            'gender' => $user->getGender(),
            'active' => $user->isActive(),
            'deletedAt' => $user->getDeletedAt() ? $user->getDeletedAt()->format('Y-m-d H:i:s') : null,
            'avatarKey' => $user->getAvatarKey(),
            'avatarUrl' => $user->getAvatarUrl(),
        ];
        if ($user->getClient()) {
            $response['client'] = [
                'id' => $user->getClient()->getId(),
                'name' => $user->getClient()->getName(),
            ];
        }
        if ($user->getPersonal()) {
            $response['personal'] = [
                'id' => $user->getPersonal()->getId(),
                'showPlatformExercises' => $user->getPersonal()->isShowPlatformExercises(),
            ];
        }
        return $response;
    }

    #[Route('/verify-email/{token}', name: 'verify_email', methods: ['GET'])]
    public function verifyEmail(string $token): JsonResponse
    {
        $user = $this->userRepository->findOneBy(['verificationToken' => $token]);

        if (!$user) {
            throw new UnprocessableEntityHttpException('Token de verificação inválido');
        }

        if ($user->isVerified()) {
            return new JsonResponse([
                'success' => true,
                'message' => 'Conta já verificada'
            ]);
        }

        $user->setIsVerified(true);
        $user->setVerificationToken(null);
        $this->em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Email verificado com sucesso'
        ]);
    }

    #[Route('/resend-verification', name: 'resend_verification', methods: ['POST'])]
    public function resendVerification(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['email'])) {
            throw new UnprocessableEntityHttpException('Email é obrigatório');
        }

        $user = $this->userRepository->findOneBy(['email' => $data['email']]);

        if (!$user) {
            return new JsonResponse([
                'success' => true,
                'message' => 'Se o email estiver cadastrado, um link de verificação será enviado.'
            ]);
        }

        if ($user->isVerified()) {
            return new JsonResponse([
                'success' => true,
                'message' => 'Conta já verificada'
            ]);
        }

        try {
            $this->emailVerificationService->sendVerificationEmail($user);
        } catch (\Exception $e) {
            throw new UnprocessableEntityHttpException('Erro ao enviar email de verificação');
        }

        return new JsonResponse([
            'success' => true,
            'message' => 'Email de verificação reenviado com sucesso'
        ]);
    }

    #[Route('/forgot-password', name: 'forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data) || !isset($data['email'])) {
            throw new UnprocessableEntityHttpException('Email é obrigatório');
        }

        $user = $this->userRepository->findOneBy(['email' => $data['email']]);

        if (!$user) {
            return new JsonResponse([
                'success' => true,
                'message' => 'Se o email estiver cadastrado, um link de recuperação será enviado.'
            ]);
        }

        try {
            $this->passwordResetService->sendPasswordResetEmail($user);
        } catch (\Exception $e) {
            throw new UnprocessableEntityHttpException('Erro ao enviar email de recuperação');
        }

        return new JsonResponse([
            'success' => true,
            'message' => 'Email de recuperação de senha enviado com sucesso'
        ]);
    }

    #[Route('/reset-password', name: 'reset_password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new UnprocessableEntityHttpException('Dados inválidos');
        }

        if (!isset($data['token']) || !isset($data['password'])) {
            throw new UnprocessableEntityHttpException('Token e senha são obrigatórios');
        }

        $user = $this->userRepository->findOneBy(['resetToken' => $data['token']]);

        if (!$user) {
            throw new UnprocessableEntityHttpException('Token de recuperação inválido');
        }

        if ($user->getResetTokenExpiresAt() && $user->getResetTokenExpiresAt() < new \DateTimeImmutable()) {
            throw new UnprocessableEntityHttpException('Token de recuperação expirado');
        }

        if (strlen($data['password']) < 8) {
            throw new UnprocessableEntityHttpException('A senha deve ter pelo menos 8 caracteres');
        }

        if (!preg_match('/[a-z]/', $data['password'])) {
            throw new UnprocessableEntityHttpException('A senha deve conter letras minúsculas');
        }

        if (!preg_match('/[A-Z]/', $data['password'])) {
            throw new UnprocessableEntityHttpException('A senha deve conter letras maiúsculas');
        }

        if (!preg_match('/[0-9]/', $data['password'])) {
            throw new UnprocessableEntityHttpException('A senha deve conter números');
        }

        $hashedPassword = $this->passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        $user->setResetToken(null);
        $user->setResetTokenExpiresAt(null);

        $this->em->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Senha redefinida com sucesso'
        ]);
    }
}
