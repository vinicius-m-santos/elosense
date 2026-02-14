import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useApi } from "@/api/Api";
import toast from "react-hot-toast";
import { Eye, EyeOff, Moon, Sun, Zap, Loader2 } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const googleClientId =
    (import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env
        ?.VITE_GOOGLE_CLIENT_ID ?? "";

export default function Login() {
    const { login } = useAuth();
    const [dark, setDark] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const api = useApi();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/";

    const isDark = dark;
    const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
    const textMuted = isDark ? "text-zinc-500" : "text-zinc-500";
    const bgMain = isDark ? "bg-zinc-950" : "bg-zinc-100";
    const glassCard = isDark
        ? "border-white/10 bg-white/5 backdrop-blur-xl"
        : "border-zinc-200/80 bg-white/80 backdrop-blur-xl";
    const inputClass = isDark
        ? "bg-white/5 border-white/10 focus-visible:ring-purple-500 text-zinc-100"
        : "bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500";

    const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
        const credential = credentialResponse.credential;
        if (!credential) return;
        setGoogleLoading(true);
        try {
            const res = await api.post("/auth/google", { credential });
            if (res.data?.success && res.data?.token && res.data?.user) {
                login(res.data.token, res.data.user, res.data.refresh_token, { redirectTo: from });
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
            const res = await api.post("/login_check", { email, password });
            if (res.data?.requiresVerification) {
                navigate("/email-not-verified");
                return;
            }
            if (!res.data?.success) {
                toast.error(res.data?.message ?? "Falha ao entrar");
                return;
            }
            login(res.data.token, res.data.user, res.data.refresh_token, { redirectTo: from });
        } catch (e: unknown) {
            const data = (e as { response?: { data?: { success?: boolean; requiresVerification?: boolean; error?: string; message?: string } } })?.response?.data;
            if (data?.requiresVerification) {
                navigate("/email-not-verified");
                return;
            }
            if (data?.error) toast.error(data.error);
            else if (data?.message) toast.error(data.message);
            else toast.error("Falha ao entrar. Verifique email e senha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen w-full transition-colors duration-500 ${bgMain} ${textPrimary}`}>
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
                <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
            </div>

            <header className={`relative z-10 border-b ${isDark ? "border-white/5" : "border-zinc-200/80"} backdrop-blur-xl`}>
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2 font-semibold tracking-tight">
                        <Zap className="h-5 w-5 text-purple-400" />
                        <span className="text-lg">EloSense</span>
                        <Badge className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20">Entrar</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <Sun className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
                        <Switch checked={dark} onCheckedChange={setDark} />
                        <Moon className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
                <Card className={`w-full max-w-sm ${glassCard}`}>
                    <CardContent className="p-6 space-y-4">
                        <h2 className={`text-xl font-semibold ${textPrimary} text-center`}>Bem-vindo</h2>
                        <p className={`text-center text-sm ${textMuted} mb-4`}>Entre na sua conta para continuar</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className={`text-sm ${textMuted}`}>Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className={`text-sm ${textMuted}`}>Senha</label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`pr-10 ${inputClass}`}
                                        required
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
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Entrar"}
                            </Button>

                            {googleClientId && (
                                <>
                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className={`w-full border-t ${isDark ? "border-white/10" : "border-zinc-200"}`} />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className={`px-2 ${textMuted}`}>ou</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        {googleLoading ? (
                                            <Button type="button" disabled className="w-full">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </Button>
                                        ) : (
                                            <GoogleLogin
                                                onSuccess={handleGoogleSuccess}
                                                onError={() => toast.error("Falha ao entrar com Google")}
                                                useOneTap={false}
                                                theme="filled"
                                                size="large"
                                                width="100%"
                                                shape="rectangular"
                                                text="signin_with"
                                                locale="pt-BR"
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </form>

                        <div className="text-center space-y-2 pt-2">
                            <p className="text-sm">
                                <Link to="/register" className="text-purple-400 hover:underline">Criar conta</Link>
                                <span className={textMuted}> · </span>
                                <Link to="/forgot-password" className="text-purple-400 hover:underline">Esqueci minha senha</Link>
                            </p>
                            <p className="text-sm">
                                <Link to="/" className={textMuted}>Voltar ao início</Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
