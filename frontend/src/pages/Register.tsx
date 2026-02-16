import { useState, useEffect } from "react";
import { useApi } from "@/api/Api";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AppHeader } from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter/AppFooter";

const inputClass = "bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100";

const registerSchema = z
    .object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
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

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const api = useApi();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        trigger,
        formState: { errors, isValid },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
    });

    const password = watch("password", "");
    const confirmPassword = watch("confirmPassword", "");

    useEffect(() => {
        if (confirmPassword) trigger("confirmPassword");
    }, [password, confirmPassword, trigger]);

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true);
        try {
            const res = await api.post("/register", {
                firstName: data.name,
                lastName: data.name,
                email: data.email,
                password: data.password,
            });
            if (res.data?.message?.includes("Senha definida")) {
                toast.success(res.data.message);
                navigate("/login");
                return;
            }
            toast.success("Cadastro realizado! Verifique seu email para ativar sua conta.");
            navigate("/register-success");
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Erro ao cadastrar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
                <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
            </div>

            <AppHeader backTo="/" badgeLabel="Criar conta" maxWidth="max-w-6xl" />

            <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
                <Card className="w-full max-w-sm border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">Criar conta</h2>
                        <p className="text-center text-sm text-zinc-500 mb-4">Preencha os dados para se cadastrar</p>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm text-zinc-500">Nome</label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Seu nome"
                                    className={inputClass}
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-400">{errors.name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm text-zinc-500">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    className={inputClass}
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-400">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm text-zinc-500">Senha</label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={`pr-10 ${inputClass}`}
                                        {...register("password")}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-400">{errors.password.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm text-zinc-500">Confirmar senha</label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={`pr-10 ${inputClass}`}
                                        {...register("confirmPassword")}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || !isValid}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Cadastrar"}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-zinc-500 pt-2">
                            Já tem conta? <Link to="/login" className="text-purple-400 hover:underline">Faça login</Link>
                        </p>
                        <p className="text-center text-sm">
                            <Link to="/" className="text-zinc-500">Voltar ao início</Link>
                        </p>
                    </CardContent>
                </Card>
            </main>
            <AppFooter />
        </div>
    );
}
