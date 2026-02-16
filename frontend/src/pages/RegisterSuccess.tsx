import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter/AppFooter";

export default function RegisterSuccess() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
                <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
            </div>

            <AppHeader backTo="/" badgeLabel="Verificação" maxWidth="max-w-6xl" />

            <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
                <Card className="w-full max-w-md border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <CardContent className="p-8 text-center">
                        <div className="mb-6 flex justify-center">
                            <CheckCircle className="h-16 w-16 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Cadastro realizado com sucesso!</h2>
                        <p className="text-zinc-500 mb-4">
                            Enviamos um email de verificação para você. Verifique sua caixa de entrada
                            e clique no link para ativar sua conta.
                        </p>
                        <p className="text-sm text-zinc-500 mb-8">
                            Não recebeu? Verifique a pasta de spam ou lixo eletrônico.
                        </p>
                        <Button
                            onClick={() => navigate("/login")}
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 text-white"
                        >
                            Ir para Login
                        </Button>
                        <p className="text-sm text-zinc-500 mt-4">
                            <Link to="/" className="text-purple-400 hover:underline">Voltar ao início</Link>
                        </p>
                    </CardContent>
                </Card>
            </main>
            <AppFooter />
        </div>
    );
}
