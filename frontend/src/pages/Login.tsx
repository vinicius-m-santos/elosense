import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useApi } from "@/api/Api";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/components/ui/buttonLoader";

const googleClientId =
    (import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env
        ?.VITE_GOOGLE_CLIENT_ID ?? "";

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const api = useApi();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
        const credential = credentialResponse.credential;
        if (!credential) return;
        setGoogleLoading(true);
        try {
            const res = await api.post("/auth/google", { credential });
            if (res.data?.success && res.data?.token && res.data?.user) {
                login(res.data.token, res.data.user, res.data.refresh_token);
            } else {
                toast.error("Falha ao entrar com Google");
            }
        } catch (e: unknown) {
            const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
            toast.error(data?.message ?? "Falha ao entrar com Google");
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post("/login_check", {
                email: email,
                password: password,
            });

            if (res.data.requiresVerification) {
                navigate("/email-not-verified");
                return;
            }

            if (!res.data.success) {
                toast.error(res.data.message);
                return;
            }

            login(res.data.token, res.data.user, res.data.refresh_token);
        } catch (e: unknown) {
            const data = (e as { response?: { data?: { success?: boolean; requiresVerification?: boolean; error?: string; message?: string } } })?.response?.data;

            if (!data?.success) {
                if (data?.requiresVerification) {
                    navigate("/email-not-verified");
                    return;
                }

                if (data?.error) {
                    toast.error(data.error);
                }

                if (data?.message) {
                    toast.error(data.message);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
            <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-sm animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
                    Bem-vindo
                </h2>
                <p className="text-center text-gray-500 mb-8 text-sm">
                    Entre na sua conta para continuar
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="seu@email.com"
                            required
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 cursor-pointer text-white font-semibold rounded-lg py-2 hover:bg-blue-700 transition-colors disabled:opacity-80 mb-0"
                        disabled={loading}
                    >
                        {!loading && "Entrar"}
                        {loading && <ButtonLoader />}
                    </Button>

                    {googleClientId && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-2 text-gray-500">ou</span>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                {googleLoading ? (
                                    <Button
                                        type="button"
                                        disabled
                                        className="w-full rounded-lg py-2"
                                    >
                                        <ButtonLoader />
                                    </Button>
                                ) : (
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => {
                                            toast.error("Falha ao entrar com Google");
                                        }}
                                        useOneTap={false}
                                        theme="outline"
                                        size="large"
                                        width={320}
                                        shape="rectangular"
                                        text="signin_with"
                                    />
                                )}
                            </div>
                        </>
                    )}
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => navigate("/register")}
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                    >
                        Não tem uma conta? Cadastre-se
                    </button>
                </div>

                <div className="text-center mt-4">
                    <button
                        onClick={() => navigate("/forgot-password")}
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                    >
                        Esqueci minha senha
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
