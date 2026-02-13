import { useState, useEffect } from "react";
import { useApi } from "@/api/Api";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/components/ui/buttonLoader";
import { Eye, EyeOff } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { parse, isValid as isValidDate } from "date-fns";
import PhoneInput from "@/components/ui/Inputs/PhoneInput";
import BirthDateInput, { birthDateToISO } from "@/components/Inputs/BirthDateInput";
import { useRequest } from "@/api/request";

const registerSchema = z
    .object({
        firstName: z.string().min(1, "Nome é obrigatório"),
        lastName: z.string().min(1, "Sobrenome é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z
            .string()
            .optional()
            .refine(
                (val) => {
                    if (!val || !val.trim()) return true;
                    const digits = val.replace(/\D/g, "");
                    return digits.length === 10 || digits.length === 11;
                },
                { message: "Telefone inválido. Use o formato (00) 00000-0000 ou (00) 0000-0000" }
            ),
        birthDate: z
            .string()
            .optional()
            .nullable()
            .refine(
                (val) => {
                    if (!val?.trim()) return true;
                    const parsed = parse(val, "dd/MM/yyyy", new Date());
                    if (isValidDate(parsed)) {
                        return parsed <= new Date() && parsed >= new Date("1900-01-01");
                    }
                    return false;
                },
                { message: "Data inválida. Use o formato dd/mm/aaaa" }
            ),
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

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const api = useApi();
    const navigate = useNavigate();
    const request = useRequest();

    const {
        register,
        handleSubmit,
        watch,
        control,
        trigger,
        formState: { errors, isValid },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
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

    const onSubmit = async (data: RegisterFormData) => {
        setLoading(true);

        const birthDateString = birthDateToISO(data.birthDate ?? null);

        await request({
            method: "POST",
            url: "/register",
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                phone: data.phone || null,
                birthDate: birthDateString,
            },
            showSuccess: false,
            onAccept: (payload: { message?: string }) => {
                setLoading(false);
                if (payload?.message?.includes("Senha definida")) {
                    toast.success(payload.message);
                    navigate("/login");
                    return;
                }
                toast.success(
                    "Cadastro realizado com sucesso! Verifique seu email para ativar sua conta."
                );
                navigate("/register-success");
            },
            onReject: () => {
                setLoading(false);
            },
        });
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
            <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-md animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
                    Criar Conta
                </h2>
                <p className="text-center text-gray-500 mb-8 text-sm">
                    Preencha os dados para se cadastrar
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="firstName"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Nome
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                {...register("firstName")}
                                className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nome"
                                required
                            />
                            {errors.firstName && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.firstName.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="lastName"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Sobrenome
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                {...register("lastName")}
                                className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Sobrenome"
                                required
                            />
                            {errors.lastName && (
                                <p className="text-xs text-red-500 mt-1">
                                    {errors.lastName.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            {...register("email")}
                            className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="seu@email.com"
                            required
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Telefone (opcional)
                        </label>
                        <Controller
                            control={control}
                            name="phone"
                            render={({ field, fieldState }) => (
                                <div>
                                    <PhoneInput
                                        value={field.value || ""}
                                        onChange={(label, value) => {
                                            field.onChange(value);
                                        }}
                                        onBlur={field.onBlur}
                                        required={false}
                                        customClass="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        label="phone"
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="birthDate"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Data de Nascimento (opcional)
                        </label>
                        <Controller
                            control={control}
                            name="birthDate"
                            render={({ field, fieldState }) => (
                                <div>
                                    <BirthDateInput
                                        value={field.value ?? ""}
                                        onChange={(val) => field.onChange(val)}
                                        onBlur={field.onBlur}
                                        placeholder="dd/mm/aaaa"
                                        id="birthDate"
                                        className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Senha
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
                            Confirmar Senha
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
                        {!loading && "Cadastrar"}
                        {loading && <ButtonLoader />}
                    </Button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Já tem uma conta?{" "}
                        <Link to="/login" className="text-blue-600 hover:underline">
                            Faça login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
