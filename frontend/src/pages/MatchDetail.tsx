import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sword,
  Coins,
  Eye,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { fetchMatchDetail, getMatchTips, type MatchSummary } from "@/api/lolApi";
import { getQueueType } from "@/utils/getQueueType";

const STORAGE_KEY = "elosense_player";

function getStoredPlayer(): { puuid: string; gameName: string; tagLine: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { puuid: string; gameName: string; tagLine: string };
  } catch {
    return null;
  }
}

export default function MatchDetailPageConsistent() {
  const [dark, setDark] = useState(true);
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { puuid: string; gameName: string; tagLine: string } | undefined;
  const state = locationState ?? getStoredPlayer();

  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const puuid = state?.puuid ?? null;

  useEffect(() => {
    if (!matchId || !puuid) {
      setError("Dados da partida não encontrados. Busque um jogador na página inicial.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchMatchDetail(matchId, puuid)
      .then(setMatch)
      .catch((err) => {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          "Erro ao carregar partida."
        );
      })
      .finally(() => setLoading(false));
  }, [matchId, puuid]);

  const isDark = dark;
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textSecondary = isDark ? "text-zinc-400" : "text-zinc-600";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-500";
  const bgMain = isDark ? "bg-zinc-950" : "bg-zinc-100";
  const glassCard = isDark
    ? "border-white/10 bg-white/5 backdrop-blur-xl"
    : "border-zinc-200/80 bg-white/80 backdrop-blur-xl";

  const scoreBadge = (score: string) => {
    const map: Record<string, string> = {
      S: "bg-purple-500/20 text-purple-300 dark:text-purple-400 border-purple-500/30",
      A: "bg-blue-500/20 text-blue-300 dark:text-blue-400 border-blue-500/30",
      B: "bg-emerald-500/20 text-emerald-300 dark:text-emerald-400 border-emerald-500/30",
      C: "bg-amber-500/20 text-amber-300 dark:text-amber-400 border-amber-500/30",
      D: "bg-red-500/20 text-red-300 dark:text-red-400 border-red-500/30",
    };
    return map[score] ?? map.C;
  };

  const metricsConfig = (m: MatchSummary) => [
    {
      label: "CS/min",
      value: m.csPerMin.toFixed(1),
      status: m.csPerMin >= 6 ? "good" : "warn",
      icon: Sword,
    },
    {
      label: "Gold/min",
      value: m.goldPerMin != null ? Math.round(m.goldPerMin).toString() : "—",
      status: "neutral",
      icon: Coins,
    },
    {
      label: "Vision Score",
      value: m.visionScore.toFixed(1),
      status: m.visionScore >= 15 ? "good" : "warn",
      icon: Eye,
    },
    {
      label: "Kill Participation",
      value: m.killParticipation != null ? `${m.killParticipation.toFixed(0)}%` : "—",
      status: "neutral",
      icon: Target,
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen w-full ${bgMain} ${textPrimary} flex items-center justify-center`}>
        <div className={`flex items-center gap-2 ${textMuted}`}>
          <Loader2 className="h-6 w-6 animate-spin" />
          Calculando métricas…
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className={`min-h-screen w-full ${bgMain} ${textPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <p className={textMuted}>{error ?? "Partida não encontrada."}</p>
          <Button className="mt-4" onClick={() => navigate(state ? "/dashboard" : "/")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const tips = getMatchTips(match);
  const durationMin = match.gameDuration != null ? Math.floor(match.gameDuration / 60) : null;

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${bgMain} ${textPrimary}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <header
        className={`relative z-10 border-b backdrop-blur-xl ${isDark ? "border-white/5" : "border-zinc-200/80"}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={`${textSecondary} hover:text-white hover:bg-white/10`}
              onClick={() => navigate("/dashboard", { state })}
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center gap-2 font-semibold tracking-tight">
              <Zap className="h-5 w-5 text-purple-400" />
              <span className="text-lg">EloSense</span>
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                Match Analysis
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={dark} onCheckedChange={setDark} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={glassCard}>
            <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${match.champion}.png`}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover bg-zinc-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/64?text=Champ";
                  }}
                />
                <div>
                  <div className={`text-lg ${textPrimary} font-semibold`}>{match.champion}</div>
                  <div className={`text-sm ${textSecondary}`}>
                    {match.kda} • {match.result ? "Vitória" : "Derrota"}
                    {durationMin != null ? ` • ${durationMin} min` : ""}
                  </div>
                  <div className={`text-xs ${textMuted} mt-0.5`}>
                    {getQueueType(match.queueId)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm ${textSecondary}`}>Score</div>
                <div
                  className={`text-3xl font-bold ${scoreBadge(match.score)} border rounded-lg px-2 inline-block`}
                >
                  {match.score}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="grid md:grid-cols-4 gap-4">
            {metricsConfig(match).map((metric) => (
              <Card key={metric.label} className={glassCard}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <metric.icon size={16} className={textSecondary} />
                    {metric.status === "good" && (
                      <CheckCircle size={16} className="text-emerald-400" />
                    )}
                    {metric.status === "warn" && (
                      <AlertTriangle size={16} className="text-amber-400" />
                    )}
                  </div>
                  <div className={`text-lg ${textPrimary} font-semibold`}>{metric.value}</div>
                  <div className={`text-xs ${textSecondary}`}>{metric.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={glassCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} className="text-purple-400" />
                <span className={`text-lg ${textPrimary} font-semibold`}>Métricas detalhadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className={`text-sm ${textSecondary}`}>Damage/min</span>
                  <p className={`text-lg ${textPrimary} font-semibold`}>{match.damagePerMin.toFixed(0)}</p>
                </div>
                <div>
                  <span className={`text-sm ${textSecondary}`}>Deaths</span>
                  <p className={`text-lg ${textPrimary} font-semibold`}>{match.deaths}</p>
                </div>
                <div>
                  <span className={`text-sm ${textSecondary}`}>Early deaths</span>
                  <p className={`text-lg ${textPrimary} font-semibold`}>{match.earlyDeaths}</p>
                </div>
                <div>
                  <span className={`text-sm ${textSecondary}`}>Solo deaths</span>
                  <p className={`text-lg ${textPrimary} font-semibold`}>{match.soloDeaths}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className={glassCard}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-400" />
                  <span className={`text-lg ${textPrimary} font-semibold`}>Análise automática</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {tips.map((tip, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 p-3 rounded-lg border bg-amber-500/10 text-amber-300 dark:text-amber-400 border-amber-500/20`}
                    >
                      <AlertTriangle size={18} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <footer
        className={`relative z-10 border-t py-6 text-center text-sm ${textMuted} ${isDark ? "border-white/5" : "border-zinc-200/80"}`}
      >
        © 2026 EloSense
      </footer>
    </div>
  );
}
