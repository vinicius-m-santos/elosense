import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import ButtonLoader from "@/components/ui/buttonLoader";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useRequest } from "@/api/request";
import { AppHeader } from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter/AppFooter";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[a-z]/, "A senha deve conter letras minúsculas")
      .regex(/[A-Z]/, "A senha deve conter letras maiúsculas")
      .regex(/[0-9]/, "A senha deve conter números"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const inputClass =
  "bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100";

function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong";
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Pelo menos 8 caracteres");

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Letras minúsculas");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Letras maiúsculas");

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("Números");

  if (password.length >= 12) score += 1;

  let strength: "weak" | "medium" | "strong" = "weak";
  if (score >= 4) strength = "strong";
  else if (score >= 3) strength = "medium";

  return { strength, score, feedback };
}

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const request = useRequest();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const password = watch("password", "");
  const confirmPassword = watch("confirmPassword", "");
  const passwordStrength = password ? getPasswordStrength(password) : null;

  useEffect(() => {
    if (confirmPassword) {
      trigger("confirmPassword");
    }
  }, [password, confirmPassword, trigger]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Token inválido");
      return;
    }

    setLoading(true);
    setError(null);

    await request({
      method: "POST",
      url: "/reset-password",
      data: {
        token: token,
        password: data.password,
      },
      successMessage: "Senha redefinida com sucesso!",
      showSuccess: true,
      onAccept: () => {
        setSuccess(true);
        setLoading(false);
      },
      onReject: (err: { message?: string }) => {
        setLoading(false);
        setError(err.message || "Erro ao redefinir senha");
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
        </div>
        <AppHeader backTo="/login" badgeLabel="Redefinir senha" maxWidth="max-w-6xl" />
        <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <CheckCircle className="h-16 w-16 text-emerald-500 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Senha redefinida!
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Sua senha foi redefinida com sucesso. Você pode fazer login com sua nova senha.
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
              >
                Ir para Login
              </Button>
            </CardContent>
          </Card>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
        </div>
        <AppHeader backTo="/login" badgeLabel="Redefinir senha" maxWidth="max-w-6xl" />
        <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <XCircle className="h-16 w-16 text-red-500 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Erro ao redefinir senha
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/forgot-password")}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                >
                  Solicitar novo link
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full border-zinc-200 text-zinc-900 dark:border-white/10 dark:text-zinc-100 hover:bg-white/10"
                >
                  Voltar para Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>
      <AppHeader backTo="/login" badgeLabel="Redefinir senha" maxWidth="max-w-6xl" />
      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-2">
              Redefinir senha
            </h2>
            <p className="text-center text-zinc-500 mb-6 text-sm">
              Digite sua nova senha
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Nova senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    {...register("password")}
                    className={`pr-10 ${inputClass}`}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-zinc-500" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
                {passwordStrength && password && (
                  <div className="space-y-1 mt-2">
                    <div className="flex gap-1 h-1.5">
                      <div
                        className={`flex-1 rounded ${
                          passwordStrength.strength === "weak"
                            ? "bg-red-500"
                            : passwordStrength.strength === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      <div
                        className={`flex-1 rounded ${
                          passwordStrength.strength === "strong"
                            ? "bg-emerald-500"
                            : passwordStrength.strength === "medium"
                              ? "bg-amber-500"
                              : "bg-zinc-300 dark:bg-zinc-700"
                        }`}
                      />
                      <div
                        className={`flex-1 rounded ${
                          passwordStrength.strength === "strong"
                            ? "bg-emerald-500"
                            : "bg-zinc-300 dark:bg-zinc-700"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Força:{" "}
                      <span
                        className={
                          passwordStrength.strength === "weak"
                            ? "text-red-500 dark:text-red-400"
                            : passwordStrength.strength === "medium"
                              ? "text-amber-500 dark:text-amber-400"
                              : "text-emerald-500 dark:text-emerald-400"
                        }
                      >
                        {passwordStrength.strength === "weak"
                          ? "Fraca"
                          : passwordStrength.strength === "medium"
                            ? "Média"
                            : "Forte"}
                      </span>
                    </p>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                        {passwordStrength.feedback.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    {...register("confirmPassword")}
                    className={`pr-10 ${inputClass}`}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-zinc-500" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-70"
                disabled={loading || !isValid}
              >
                {!loading && "Redefinir senha"}
                {loading && <ButtonLoader />}
              </Button>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-purple-400 hover:underline"
              >
                Voltar para Login
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
