import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Moon, Sun, Zap } from "lucide-react";

export default function RegisterSuccess() {
    const [dark, setDark] = useState(true);
    const navigate = useNavigate();

    const isDark = dark;
    const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
    const textMuted = isDark ? "text-zinc-500" : "text-zinc-500";
    const bgMain = isDark ? "bg-zinc-950" : "bg-zinc-100";
    const glassCard = isDark
        ? "border-white/10 bg-white/5 backdrop-blur-xl"
        : "border-zinc-200/80 bg-white/80 backdrop-blur-xl";

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
                            <CheckCircle className="h-16 w-16 text-emerald-500" />
                        </div>
                        <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>Cadastro realizado com sucesso!</h2>
                        {/* <div className="mb-6 flex justify-center">
                            <Mail className="h-12 w-12 text-purple-400" />
                        </div> */}
                        <p className={`${textMuted} mb-4`}>
                            Enviamos um email de verificação para você. Verifique sua caixa de entrada
                            e clique no link para ativar sua conta.
                        </p>
                        <p className={`text-sm ${textMuted} mb-8`}>
                            Não recebeu? Verifique a pasta de spam ou lixo eletrônico.
                        </p>
                        <Button
                            onClick={() => navigate("/login")}
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white"
                        >
                            Ir para Login
                        </Button>
                        <p className={`text-sm ${textMuted} mt-4`}>
                            <Link to="/" className="text-purple-400 hover:underline">Voltar ao início</Link>
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
