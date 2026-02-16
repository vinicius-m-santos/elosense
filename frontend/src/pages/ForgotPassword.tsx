import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import ButtonLoader from "@/components/ui/buttonLoader";
import { Mail } from "lucide-react";
import { useApi } from "@/api/Api";
import { AppHeader } from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter/AppFooter";

const inputClass =
  "bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const api = useApi();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/forgot-password", { email });
      if (res.data.success) {
        setEmailSent(true);
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const data = err.response?.data;
      if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error("Erro ao enviar email de recuperação");
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
        </div>
        <AppHeader backTo="/login" badgeLabel="Recuperar senha" maxWidth="max-w-6xl" />
        <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-8 text-center">
              <div className="mb-6 flex justify-center">
                <Mail className="h-16 w-16 text-purple-500 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Email enviado!
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Enviamos um link de recuperação de senha para{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">{email}</strong>.
                Verifique sua caixa de entrada e siga as instruções.
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-sm">
                O link expira em 24 horas.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                >
                  Voltar para Login
                </Button>
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full border-zinc-200 text-zinc-900 dark:border-white/10 dark:text-zinc-100 hover:bg-white/10"
                >
                  Enviar para outro email
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
      <AppHeader backTo="/login" badgeLabel="Recuperar senha" maxWidth="max-w-6xl" />
      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16">
        <Card className="w-full max-w-sm border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-2">
              Recuperar senha
            </h2>
            <p className="text-center text-zinc-500 mb-6 text-sm">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-600 dark:text-zinc-400"
                >
                  Email
                </label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-80"
                disabled={loading}
              >
                {!loading && "Enviar link de recuperação"}
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
