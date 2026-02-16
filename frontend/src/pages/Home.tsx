import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, BarChart3, Target, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { fetchPlayer, fetchMatches } from "@/api/lolApi";
import { useAuthStore } from "@/stores/authStore";
import { useSearchStore } from "@/stores/searchStore";
import { useAuth } from "@/providers/AuthProvider";
import { AppHeader } from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter/AppFooter";

const DEFAULT_REGION = "BR1";
const REGIONS = ["BR1", "NA1", "LA1", "LA2", "LAN1", "LAS1", "EUW1", "EUN1", "TR1", "KR", "JP1", "OC1", "PH2", "SG2", "TH2", "TW2", "VN2"];

export default function HomePage() {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"idle" | "player" | "matches">("idle");
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const getFreeSearchCount = useSearchStore((s) => s.getFreeSearchCount);
  const incrementFreeSearch = useSearchStore((s) => s.incrementFreeSearch);
  const canSearch = useSearchStore((s) => s.canSearch);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLimitReached(false);
    const g = gameName.trim();
    const t = tagLine.trim();
    const r = region.trim();
    if (!g || !t || !r) {
      setError("Preencha Game Name e Tag.");
      return;
    }
    if (!useAuthStore.getState().hasStoredToken()) {
      if (!canSearch()) {
        setLimitReached(true);
        return;
      }
    }
    setLoading(true);
    try {
      setLoadingStep("player");
      const player = await fetchPlayer(g, t, r);
      setLoadingStep("matches");
      const matches = await fetchMatches({ puuid: player.puuid, region: r });
      if (!useAuthStore.getState().hasStoredToken()) {
        incrementFreeSearch();
      }
      navigate("/dashboard", {
        state: { player, region: r, matches },
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
    <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <AppHeader
        badgeLabel="Beta"
        maxWidth="max-w-6xl"
      />

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
            className="mt-4 max-w-xl text-zinc-500"
          >
            Analise suas partidas, receba métricas e descubra o que está te impedindo de subir de elo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 w-full max-w-md"
          >
            <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardContent className="space-y-4 p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-sm text-zinc-500">Nome de invocador</label>
                    <Input
                      placeholder="Ex.: Faker"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      disabled={loading}
                      className="bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-sm text-zinc-500">Tag</label>
                    <Input
                      placeholder="Ex.: BR1"
                      value={tagLine}
                      onChange={(e) => setTagLine(e.target.value)}
                      disabled={loading}
                      className="bg-zinc-50 border-zinc-200 text-zinc-900 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label htmlFor="region-select" className="text-sm text-zinc-500">Região</label>
                    <Select
                      value={region}
                      onValueChange={setRegion}
                      disabled={loading || true}
                    >
                      <SelectTrigger id="region-select" className="w-full text-zinc-900 dark:text-zinc-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        className="bg-white border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-white/10 dark:text-zinc-100"
                      >
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                  {limitReached && (
                    <div className="rounded-lg border p-4 text-sm bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-200">
                      <p className="mb-3">Você atingiu o limite de 3 pesquisas gratuitas hoje. Faça login para continuar.</p>
                      <div className="flex flex-col flex-wrap gap-2">
                        <Button type="button" variant="default" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white" asChild>
                          <Link to="/login" state={{ from: "/" }}>Entrar</Link>
                        </Button>
                        <Button type="button" variant="outline" asChild>
                          <Link to="/register">Criar conta</Link>
                        </Button>
                      </div>
                    </div>
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
                <p className="text-xs text-zinc-500">Não é necessário login. Resultados em segundos.</p>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-purple-400" />}
              title="Métricas profissionais"
              description="CS/min, part. em abates, dano e muito mais."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6 text-blue-400" />}
              title="Identifique seus erros"
              description="Descubra o que está te impedindo de subir de elo."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6 text-pink-400" />}
              title="Feedback automático"
              description="Dicas baseadas em regras para melhorar seu gameplay."
            />
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-zinc-200/80 bg-white/80 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 p-6 backdrop-blur-xl transition-all"
    >
      <div className="mb-3">{icon}</div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </motion.div>
  );
}
