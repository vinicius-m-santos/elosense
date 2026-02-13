import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/components/ui/buttonLoader";
import { Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useRequest } from "@/api/request";

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

const ResetPassword = () => {
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

    // Valida a confirmação de senha em tempo real quando a senha muda
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
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
                <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md animate-fade-in text-center">
                    <div className="mb-6 flex justify-center">
                        <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Senha Redefinida!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Sua senha foi redefinida com sucesso. Você pode fazer login com sua nova senha.
                    </p>
                    <Button
                        onClick={() => navigate("/login")}
                        className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors"
                    >
                        Ir para Login
                    </Button>
                </div>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
                <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md animate-fade-in text-center">
                    <div className="mb-6 flex justify-center">
                        <XCircle className="h-16 w-16 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Erro ao Redefinir Senha
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error}
                    </p>
                    <div className="space-y-3">
                        <Button
                            onClick={() => navigate("/forgot-password")}
                            className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors"
                        >
                            Solicitar Novo Link
                        </Button>
                        <Button
                            onClick={() => navigate("/login")}
                            variant="outline"
                            className="w-full text-black cursor-pointer"
                        >
                            Voltar para Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
            <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-md animate-fade-in">
                <div className="mb-6">
                    <Button
                        onClick={() => navigate("/login")}
                        variant="ghost"
                        size="icon"
                        className="mb-4"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
                        Redefinir Senha
                    </h2>
                    <p className="text-center text-gray-500 mb-8 text-sm">
                        Digite sua nova senha
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                {...register("password")}
                                className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-500" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.password.message}
                            </p>
                        )}
                        {passwordStrength && password && (
                            <div className="space-y-1 mt-2">
                                <div className="flex gap-1 h-1.5">
                                    <div
                                        className={`flex-1 rounded ${passwordStrength.strength === "weak"
                                            ? "bg-red-500"
                                            : passwordStrength.strength === "medium"
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                            }`}
                                    />
                                    <div
                                        className={`flex-1 rounded ${passwordStrength.strength === "strong"
                                            ? "bg-green-500"
                                            : passwordStrength.strength === "medium"
                                                ? "bg-yellow-500"
                                                : "bg-gray-300"
                                            }`}
                                    />
                                    <div
                                        className={`flex-1 rounded ${passwordStrength.strength === "strong"
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                            }`}
                                    />
                                </div>
                                <p className="text-xs text-gray-600">
                                    Força:{" "}
                                    <span
                                        className={
                                            passwordStrength.strength === "weak"
                                                ? "text-red-600"
                                                : passwordStrength.strength === "medium"
                                                    ? "text-yellow-600"
                                                    : "text-green-600"
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
                                    <ul className="text-xs text-gray-600 list-disc list-inside">
                                        {passwordStrength.feedback.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Confirmar Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                {...register("confirmPassword")}
                                className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-500" />
                                )}
                            </Button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors disabled:opacity-70"
                        disabled={loading || !isValid}
                    >
                        {!loading && "Redefinir Senha"}
                        {loading && <ButtonLoader />}
                    </Button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                    >
                        Voltar para Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
