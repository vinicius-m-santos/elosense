import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BarChart3, Target, Moon, Sun, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { fetchPlayer, fetchMatches } from "@/api/lolApi";

export default function HomePage() {
  const [dark, setDark] = useState(true);
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"idle" | "player" | "matches">("idle");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const g = gameName.trim();
    const t = tagLine.trim();
    if (!g || !t) {
      setError("Preencha Game Name e Tag.");
      return;
    }
    setLoading(true);
    try {
      setLoadingStep("player");
      const { puuid } = await fetchPlayer(g, t);
      setLoadingStep("matches");
      const matches = await fetchMatches(puuid);
      navigate("/dashboard", {
        state: { puuid, gameName: g, tagLine: t, matches },
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
          ?.response?.data?.error?.message ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Erro ao buscar jogador. Verifique o Riot ID e a região.";
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingStep("idle");
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
            <Badge className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20">Beta</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sun className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
            <Switch checked={dark} onCheckedChange={setDark} />
            <Moon className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              Análise avançada
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Descubra exatamente
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {" "}
              onde melhorar
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className={`mt-4 max-w-xl ${textMuted}`}
          >
            Analise suas partidas, receba métricas e descubra o que está te impedindo de subir de elo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 w-full max-w-md"
          >
            <Card className={glassCard}>
              <CardContent className="space-y-4 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className={`text-sm ${textMuted}`}>Game Name</label>
                    <Input
                      placeholder="Ex: Faker"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className={`text-sm ${textMuted}`}>Tag Line</label>
                    <Input
                      placeholder="Ex: KR1"
                      value={tagLine}
                      onChange={(e) => setTagLine(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 transition-opacity text-white"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {loadingStep === "player"
                          ? "Analisando suas partidas…"
                          : "Calculando métricas…"}
                      </span>
                    ) : (
                      "Analisar minhas partidas"
                    )}
                  </Button>
                </form>
                <p className={`text-xs ${textMuted}`}>Não precisa de login. Resultados em segundos.</p>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              isDark={isDark}
              icon={<BarChart3 className="h-6 w-6 text-purple-400" />}
              title="Métricas profissionais"
              description="CS/min, KP, damage e muito mais."
            />
            <FeatureCard
              isDark={isDark}
              icon={<Target className="h-6 w-6 text-blue-400" />}
              title="Identifique seus erros"
              description="Descubra o que está te impedindo de subir de elo."
            />
            <FeatureCard
              isDark={isDark}
              icon={<Sparkles className="h-6 w-6 text-pink-400" />}
              title="Feedback automático"
              description="Dicas baseadas em regras para melhorar seu gameplay."
            />
          </div>
        </section>
      </main>

      <footer className={`border-t py-6 text-center text-sm ${textMuted} ${isDark ? "border-white/5" : "border-zinc-200/80"}`}>
        © 2026 EloSense. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function FeatureCard({
  isDark,
  icon,
  title,
  description,
}: {
  isDark: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const glassCard = isDark
    ? "border-white/10 bg-white/5 hover:bg-white/10"
    : "border-zinc-200/80 bg-white/80 hover:bg-white";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-600";
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`rounded-2xl border p-6 backdrop-blur-xl transition-all ${glassCard}`}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className={`text-sm ${textMuted}`}>{description}</p>
    </motion.div>
  );
}
