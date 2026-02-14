import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, XCircle, Moon, Sun, Zap, Loader2 } from "lucide-react";
import { useRequest } from "@/api/request";
import { useApi } from "@/api/Api";

export default function EmailVerification() {
    const { token } = useParams<{ token: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const request = useRequest();
    const api = useApi();
    const [dark, setDark] = useState(true);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [email, setEmail] = useState("");
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alreadyVerified, setAlreadyVerified] = useState(false);
    const hasVerifiedRef = useRef(false);

    const isNotVerifiedPage = location.pathname === "/email-not-verified";

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

    const verifyEmail = useCallback(async (verificationToken: string) => {
        setLoading(true);
        setError(null);
        setAlreadyVerified(false);
        await (request as (opts: { method: string; url: string; showSuccess: boolean; onAccept: (p: { message?: string }) => void; onReject: (e: { message?: string }) => void }) => Promise<void>)({
            method: "GET",
            url: `/verify-email/${verificationToken}`,
            successMessage: "Email verificado com sucesso!",
            showSuccess: true,
            onAccept: (payload: { message?: string }) => {
                if (payload?.message === "Conta já verificada") {
                    setAlreadyVerified(true);
                } else {
                    setVerified(true);
                }
                setLoading(false);
            },
            onReject: (err: { message?: string }) => {
                setLoading(false);
                if (err?.message === "Token de verificação inválido") {
                    setAlreadyVerified(true);
                } else {
                    setError(err?.message || "Erro ao verificar email");
                }
            },
        });
    }, [request]);

    useEffect(() => {
        if (token && !isNotVerifiedPage && !hasVerifiedRef.current) {
            hasVerifiedRef.current = true;
            verifyEmail(token);
        }
    }, [token, isNotVerifiedPage, verifyEmail]);

    const resendVerification = async () => {
        if (!email) {
            toast.error("Por favor, informe seu email");
            return;
        }
        setResending(true);
        try {
            const res = await api.post("/resend-verification", { email });
            if (res.data?.success) {
                toast.success(res.data.message);
            } else {
                toast.error(res.data?.message ?? "Falha ao reenviar");
            }
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Erro ao reenviar email");
        } finally {
            setResending(false);
        }
    };

    if (isNotVerifiedPage) {
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
                            <Badge className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20">Verificação</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Sun className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
                            <Switch checked={dark} onCheckedChange={setDark} />
                            <Moon className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
                        </div>
                    </div>
                </header>
                <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
                    <Card className={`w-full max-w-md ${glassCard}`}>
                        <CardContent className="p-8 text-center">
                            <div className="mb-6 flex justify-center">
                                <Mail className="h-16 w-16 text-purple-400" />
                            </div>
                            <h2 className={`text-xl font-bold ${textPrimary} mb-4`}>Verifique seu email</h2>
                            <p className={`${textMuted} mb-4`}>
                                Sua conta ainda não foi verificada. Verifique sua caixa de entrada e clique no link que enviamos.
                            </p>
                            <p className={`${textMuted} mb-6`}>
                                Não recebeu? Informe seu email abaixo para reenviarmos o link.
                            </p>
                            <div className="space-y-4 text-left">
                                <label htmlFor="email" className={`text-sm ${textMuted}`}>Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className={inputClass}
                                />
                                <Button
                                    onClick={resendVerification}
                                    disabled={resending || !email}
                                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                                >
                                    {resending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Reenviar email de verificação"}
                                </Button>
                                <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
                                    Voltar para Login
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`min-h-screen w-full ${bgMain} ${textPrimary}`}>
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
                    <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
                </div>
                <header className={`relative z-10 border-b ${isDark ? "border-white/5" : "border-zinc-200/80"} backdrop-blur-xl`}>
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-2 font-semibold">
                            <Zap className="h-5 w-5 text-purple-400" />
                            <span className="text-lg">EloSense</span>
                            <Badge className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20">Verificação</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Sun className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
                            <Switch checked={dark} onCheckedChange={setDark} />
                            <Moon className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
                        </div>
                    </div>
                </header>
                <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
                    <Card className={`w-full max-w-md ${glassCard}`}>
                        <CardContent className="p-8 text-center">
                            <Loader2 className="h-16 w-16 animate-spin text-purple-400 mx-auto mb-4" />
                            <h2 className={`text-xl font-bold ${textPrimary} mb-2`}>Verificando...</h2>
                            <p className={textMuted}>Aguarde enquanto verificamos sua conta.</p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    let children: React.ReactNode;
    if (verified) {
        children = (
            <>
                <div className="mb-6 flex justify-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500" />
                </div>
                <h2 className={`text-xl font-bold ${textPrimary} mb-4`}>Email verificado!</h2>
                <p className={`${textMuted} mb-6`}>
                    Sua conta foi verificada com sucesso. Você já pode fazer login.
                </p>
                <Button
                    onClick={() => navigate("/login")}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                >
                    Ir para Login
                </Button>
            </>
        );
    } else if (alreadyVerified) {
        children = (
            <>
                <div className="mb-6 flex justify-center">
                    <CheckCircle className="h-16 w-16 text-emerald-500" />
                </div>
                <h2 className={`text-xl font-bold ${textPrimary} mb-4`}>Conta já verificada</h2>
                <p className={`${textMuted} mb-6`}>
                    Sua conta já foi verificada. Você pode fazer login normalmente.
                </p>
                <Button
                    onClick={() => navigate("/login")}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                >
                    Ir para Login
                </Button>
            </>
        );
    } else {
        children = (
            <>
                <div className="mb-6 flex justify-center">
                    <XCircle className="h-16 w-16 text-red-400" />
                </div>
                <h2 className={`text-xl font-bold ${textPrimary} mb-4`}>Erro na verificação</h2>
                <p className={`${textMuted} mb-6`}>{error}</p>
                <div className="space-y-3">
                    <Button
                        onClick={() => navigate("/email-not-verified")}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                    >
                        Reenviar email de verificação
                    </Button>
                    <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
                        Voltar para Login
                    </Button>
                </div>
            </>
        );
    }

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
                        <Badge className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20">Verificação</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <Sun className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
                        <Switch checked={dark} onCheckedChange={setDark} />
                        <Moon className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
                    </div>
                </div>
            </header>
            <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
                <Card className={`w-full max-w-md ${glassCard}`}>
                    <CardContent className="p-8 text-center">
                        {children}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
