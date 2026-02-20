import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sword,
  Coins,
  Eye,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchMatchDetail, fetchPlayerRank, getMatchTips, type MatchSummary } from "@/api/lolApi";
import { getQueueType, getLaneLabel } from "@/utils/getQueueType";
import { formatMatchDate } from "@/utils/dateUtils";
import { AppHeader } from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter/AppFooter";
import { usePlayerStore } from "@/stores/playerStore";
import { SkeletonMatchDetail } from "@/components/ui/skeleton";
const TIERS = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"] as const;
const TIERS_WITHOUT_RANK = ["MASTER", "GRANDMASTER", "CHALLENGER"] as const;
const RANKS = ["I", "II", "III", "IV"] as const;
const DEFAULT_COMPARE_TIER = "GOLD";
const DEFAULT_COMPARE_RANK = "I";

const TIER_LABEL_PT: Record<string, string> = {
  IRON: "Ferro",
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  PLATINUM: "Platina",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Mestre",
  GRANDMASTER: "Grão-Mestre",
  CHALLENGER: "Desafiante",
};

function getTierLabelPt(tier: string): string {
  return TIER_LABEL_PT[tier] ?? tier;
}

function tierHasRank(tier: string): boolean {
  return !TIERS_WITHOUT_RANK.includes(tier as (typeof TIERS_WITHOUT_RANK)[number]);
}

const BENCHMARK_N_TOOLTIP =
  "n = número de partidas usadas para calcular esses benchmarks no elo e posição selecionados. Quanto maior o n, mais confiável a referência.";
const BENCHMARK_P50_P75_TOOLTIP =
  "P50 (mediana): metade dos jogadores do elo/posição fica abaixo e metade acima. P75: 75% ficam abaixo; você está no top 25% do elo se atingir ou passar esse valor.";
const BENCHMARK_METRIC_TOOLTIPS: Record<string, string> = {
  "CS/min": "Creeps abatidos por minuto. Indica farm e pressão de lane.",
  "Dano/min": "Dano causado a campeões por minuto. Indica impacto em lutas.",
  Visão: "Pontuação de visão (wards, detecção). Importante para controle de mapa.",
  "Ouro/min": "Ouro ganho por minuto. Reflete farm e participação em objetivos.",
  "Part. abates %": "Porcentagem dos abates do time em que você participou (kill ou assist).",
  Mortes: "Número de mortes. Para essa métrica, menos que a mediana é melhor.",
};

/** Tooltip text for score: how it's calculated and role-specific weights. */
function getScoreTooltipContent(teamPosition: string | null | undefined): string {
  const p = (teamPosition ?? "").toUpperCase();
  const roleDesc: Record<string, string> = {
    TOP: "TOP: CS 22%, Mortes 26%, Dano 22%, Visão 15%, Part. abates 15%.",
    JUNGLE: "JG: CS 15%, Mortes 25%, Dano 20%, Visão 22%, Part. abates 18%.",
    MID: "MID: CS 25%, Mortes 22%, Dano 25%, Visão 13%, Part. abates 15%.",
    MIDDLE: "MID: CS 25%, Mortes 22%, Dano 25%, Visão 13%, Part. abates 15%.",
    BOTTOM: "ADC: CS 25%, Mortes 22%, Dano 25%, Visão 13%, Part. abates 15%.",
    UTILITY: "SUP: CS 10%, Mortes 22%, Dano 13%, Visão 30%, Part. abates 25%.",
    SUPPORT: "SUP: CS 10%, Mortes 22%, Dano 13%, Visão 30%, Part. abates 25%.",
    ADC: "ADC: CS 25%, Mortes 22%, Dano 25%, Visão 13%, Part. abates 15%.",
  };
  const roleText = roleDesc[p] ?? "Os pesos mudam conforme a posição (TOP, JG, MID, ADC, SUP).";
  return `A nota (0–100) é uma média ponderada de: CS/min, mortes (menos é melhor), dano/min, visão e participação em abates. ${roleText} Quando há dados do seu elo, a nota é comparada aos benchmarks (P50/P75) da posição.`;
}

export default function MatchDetailPageConsistent() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { puuid: string; gameName: string; tagLine: string; region?: string; tier?: string; rank?: string } | undefined;
  const storedPlayer = usePlayerStore((s) => s.player);
  const state = locationState ?? storedPlayer;

  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonTier, setComparisonTier] = useState<string>(DEFAULT_COMPARE_TIER);
  const [comparisonRank, setComparisonRank] = useState<string>(DEFAULT_COMPARE_RANK);
  const [lastFetchedTierRank, setLastFetchedTierRank] = useState<{ tier: string; rank: string } | null>(null);
  const puuid = state?.puuid ?? null;
  const region = state?.region ?? "BR1";

  useEffect(() => {
    if (!matchId || !puuid) {
      setError("Dados da partida não encontrados. Busque um jogador na página inicial.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const resolveTierRank = (): Promise<{ tier: string; rank: string }> => {
      if (state?.tier !== undefined) {
        const tier = TIERS.includes(state.tier as (typeof TIERS)[number]) ? state.tier : DEFAULT_COMPARE_TIER;
        const rank = tierHasRank(tier) && state?.rank && RANKS.includes(state.rank as (typeof RANKS)[number])
          ? state.rank
          : tierHasRank(tier) ? DEFAULT_COMPARE_RANK : "";
        return Promise.resolve({ tier, rank });
      }
      return fetchPlayerRank(puuid, region).then((r) => {
        const entry = r.entries?.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? r.entries?.[0];
        const tier = entry?.tier && TIERS.includes(entry.tier as (typeof TIERS)[number]) ? entry.tier : DEFAULT_COMPARE_TIER;
        const rank = tierHasRank(tier) && entry?.rank && RANKS.includes(entry.rank as (typeof RANKS)[number])
          ? entry.rank
          : tierHasRank(tier) ? DEFAULT_COMPARE_RANK : "";
        return { tier, rank };
      });
    };
    resolveTierRank()
      .then(({ tier, rank }) =>
        fetchMatchDetail(matchId, puuid, { region, tier, rank: rank || undefined }).then((data) => ({ data, tier, rank }))
      )
      .then(({ data, tier, rank }) => {
        setMatch(data);
        setComparisonTier(tier);
        setComparisonRank(rank);
        setLastFetchedTierRank({ tier, rank });
      })
      .catch((err) => {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          "Erro ao carregar partida."
        );
      })
      .finally(() => setLoading(false));
  }, [matchId, puuid, region, state?.region, state?.tier, state?.rank]);

  const effectiveRank = tierHasRank(comparisonTier) ? comparisonRank : "";

  useEffect(() => {
    if (!matchId || !puuid || !match || loading) return;
    if (lastFetchedTierRank?.tier === comparisonTier && lastFetchedTierRank?.rank === effectiveRank) return;
    setLoadingComparison(true);
    fetchMatchDetail(matchId, puuid, { region, tier: comparisonTier, rank: effectiveRank || undefined })
      .then((data) => {
        setMatch(data);
        setLastFetchedTierRank({ tier: comparisonTier, rank: effectiveRank });
      })
      .catch(() => { })
      .finally(() => setLoadingComparison(false));
  }, [matchId, puuid, region, match, loading, comparisonTier, comparisonRank, effectiveRank, lastFetchedTierRank?.tier, lastFetchedTierRank?.rank]);

  /** Badge style by score 0-100 (S: 90+, A: 75-89, B: 55-74, C: 35-54, D: 0-34). */
  const scoreBadge = (score: number) => {
    if (score >= 90) return "bg-purple-500/20 text-purple-300 dark:text-purple-400 border-purple-500/30";
    if (score >= 75) return "bg-blue-500/20 text-blue-300 dark:text-blue-400 border-blue-500/30";
    if (score >= 55) return "bg-emerald-500/20 text-emerald-300 dark:text-emerald-400 border-emerald-500/30";
    if (score >= 35) return "bg-amber-500/20 text-amber-300 dark:text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-300 dark:text-red-400 border-red-500/30";
  };

  const hasBenchmarks = match?.idealBenchmarks != null && match.idealBenchmarks.sampleSize > 0;
  const metricsConfig = (m: MatchSummary) => [
    {
      label: "CS/min",
      value: m.csPerMin.toFixed(1),
      status: hasBenchmarks && m.idealBenchmarks?.csPerMin?.p50 != null ? (m.csPerMin >= m.idealBenchmarks.csPerMin.p50 ? "good" : "warn") : (m.csPerMin >= 6 ? "good" : "warn"),
      icon: Sword,
    },
    {
      label: "Ouro/min",
      value: m.goldPerMin != null ? Math.round(m.goldPerMin).toString() : "—",
      status: hasBenchmarks && m.idealBenchmarks?.goldPerMin?.p50 != null ? (m.goldPerMin != null && m.goldPerMin >= m.idealBenchmarks.goldPerMin.p50 ? "good" : "warn") : "neutral",
      icon: Coins,
    },
    {
      label: "Visão",
      value: m.visionScore.toFixed(1),
      status: hasBenchmarks && m.idealBenchmarks?.visionScore?.p50 != null ? (m.visionScore >= m.idealBenchmarks.visionScore.p50 ? "good" : "warn") : (m.visionScore >= 15 ? "good" : "warn"),
      icon: Eye,
    },
    {
      label: "Part. em abates",
      value: m.killParticipation != null ? `${m.killParticipation.toFixed(0)}%` : "—",
      status: hasBenchmarks && m.idealBenchmarks?.killParticipation?.p50 != null ? (m.killParticipation != null && m.killParticipation >= m.idealBenchmarks.killParticipation.p50 ? "good" : "warn") : "neutral",
      icon: Target,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
        </div>
        <AppHeader
          backTo={state ? "/dashboard" : "/"}
          badgeLabel="Análise da partida"
          maxWidth="max-w-6xl"
          backState={state}
        />
        <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
          <SkeletonMatchDetail />
        </main>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500">{error ?? "Partida não encontrada."}</p>
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
    <div className="min-h-screen w-full transition-colors duration-500 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <AppHeader
        backTo="/dashboard"
        badgeLabel="Análise da partida"
        maxWidth="max-w-6xl"
        backState={state}
      />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
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
                  <div className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">{match.champion}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {match.kda} • {match.result ? "Vitória" : "Derrota"}
                    {durationMin != null ? ` • ${durationMin} min` : ""}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {getQueueType(match.queueId)}
                    {getLaneLabel(match.teamPosition) && ` • ${getLaneLabel(match.teamPosition)}`}
                    {formatMatchDate(match.gameEndTimestamp) && ` • ${formatMatchDate(match.gameEndTimestamp)}`}
                    {match.tier && ` • ${getTierLabelPt(match.tier)}${match.rank ? ` ${match.rank}` : ""}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Pontuação</div>
                <TooltipProvider delayDuration={200}>
                  <div className="flex items-center gap-1.5 justify-end">
                    <div
                      className={`text-3xl font-bold ${scoreBadge(typeof match.score === "number" ? match.score : 50)} border rounded-lg px-2 inline-block`}
                    >
                      {typeof match.score === "number" ? match.score : "—"}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          aria-label="Como a nota é calculada?"
                        >
                          <HelpCircle size={18} className="text-zinc-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[320px]">
                        {getScoreTooltipContent(match.teamPosition)}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
        >
          <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target size={18} className="text-purple-400" />
                <span className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">Comparar com outro elo</span>
                {loadingComparison && (
                  <span className="flex items-center gap-1.5 text-sm text-zinc-500 font-normal">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" aria-hidden />
                    Carregando comparação…
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Altere o elo e a divisão para ver benchmarks e análise em relação a esse rank.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="compare-tier" className="text-sm text-zinc-600 dark:text-zinc-400">
                  Tier
                </label>
                <Select
                  value={comparisonTier}
                  onValueChange={(v) => {
                    setComparisonTier(v);
                    if (!tierHasRank(v)) {
                      setComparisonRank("");
                    } else if (!comparisonRank || !RANKS.includes(comparisonRank as (typeof RANKS)[number])) {
                      setComparisonRank(DEFAULT_COMPARE_RANK);
                    }
                  }}
                  disabled={loadingComparison}
                >
                  <SelectTrigger id="compare-tier" className="w-[140px] text-zinc-900 dark:text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-white/10 dark:text-zinc-100">
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {getTierLabelPt(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {tierHasRank(comparisonTier) && (
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="compare-rank" className="text-sm text-zinc-600 dark:text-zinc-400">
                    Divisão
                  </label>
                  <Select
                    value={comparisonRank}
                    onValueChange={setComparisonRank}
                    disabled={loadingComparison}
                  >
                    <SelectTrigger id="compare-rank" className="w-[80px] text-zinc-900 dark:text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-white/10 dark:text-zinc-100">
                      {RANKS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              <Card key={metric.label} className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <metric.icon size={16} className="text-zinc-600 dark:text-zinc-400" />
                    {metric.status === "good" && (
                      <CheckCircle size={16} className="text-emerald-400" />
                    )}
                    {metric.status === "warn" && (
                      <AlertTriangle size={16} className="text-amber-400" />
                    )}
                  </div>
                  <div className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">{metric.value}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">{metric.label}</div>
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
          <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} className="text-purple-400" />
                <span className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">Métricas detalhadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="rounded-xl border text-card-foreground shadow border-zinc-200/80 bg-zinc-50/50 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Dano/min</span>
                    {hasBenchmarks && match.idealBenchmarks?.damagePerMin?.p50 != null && (
                      match.damagePerMin >= match.idealBenchmarks.damagePerMin.p50 ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-400" />
                      )
                    )}
                  </div>
                  <p className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">{match.damagePerMin.toFixed(0)}</p>
                </div>
                <div className="rounded-xl border text-card-foreground shadow border-zinc-200/80 bg-zinc-50/50 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Mortes</span>
                    {hasBenchmarks && match.idealBenchmarks?.deaths?.p50 != null && (
                      match.deaths <= match.idealBenchmarks.deaths.p50 ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-400" />
                      )
                    )}
                  </div>
                  <p className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">{match.deaths}</p>
                </div>
                <div className="rounded-xl border text-card-foreground shadow border-zinc-200/80 bg-zinc-50/50 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Mortes no início</span>
                    {hasBenchmarks && match.idealBenchmarks?.deaths?.p50 != null && (
                      match.earlyDeaths <= match.idealBenchmarks.deaths.p50 ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-400" />
                      )
                    )}
                  </div>
                  <p className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">{match.earlyDeaths}</p>
                </div>
                <div className="rounded-xl border text-card-foreground shadow border-zinc-200/80 bg-zinc-50/50 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Mortes solo</span>
                    {hasBenchmarks && match.idealBenchmarks?.deaths?.p50 != null && (
                      match.soloDeaths <= match.idealBenchmarks.deaths.p50 ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-400" />
                      )
                    )}
                  </div>
                  <p className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">{match.soloDeaths}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {match.idealBenchmarks != null && match.idealBenchmarks.sampleSize > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TooltipProvider delayDuration={200}>
              <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={18} className="text-purple-400" />
                    <span className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">Benchmarks de referência (elo)</span>
                  </CardTitle>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center gap-1">
                    <span>Mediana (P50) e P75 para seu elo e posição</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="inline-flex p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-purple-500/50" aria-label="O que são P50 e P75?">
                          <HelpCircle size={14} className="text-zinc-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        {BENCHMARK_P50_P75_TOOLTIP}
                      </TooltipContent>
                    </Tooltip>
                    <span> (</span>
                    <span className="inline-flex items-center gap-1">
                      n={match.idealBenchmarks.sampleSize} partidas
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-purple-500/50" aria-label="O que significa n?">
                            <HelpCircle size={14} className="text-zinc-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px]">
                          {BENCHMARK_N_TOOLTIP}
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    ).
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
                    {[
                      { key: "csPerMin", label: "CS/min", v: match.idealBenchmarks.csPerMin },
                      { key: "damagePerMin", label: "Dano/min", v: match.idealBenchmarks.damagePerMin },
                      { key: "visionScore", label: "Visão", v: match.idealBenchmarks.visionScore },
                      { key: "goldPerMin", label: "Ouro/min", v: match.idealBenchmarks.goldPerMin },
                      { key: "killParticipation", label: "Part. abates %", v: match.idealBenchmarks.killParticipation },
                      { key: "deaths", label: "Mortes", v: match.idealBenchmarks.deaths },
                    ].map(({ label, v }) => (
                      <div key={label} className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 dark:border-white/10 dark:bg-white/5">
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                          <span>{label}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="inline-flex p-0 rounded focus:outline-none focus:ring-2 focus:ring-purple-500/50 shrink-0" aria-label={`O que é ${label}?`}>
                                <HelpCircle size={12} className="text-zinc-500" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px]">
                              {BENCHMARK_METRIC_TOOLTIPS[label] ?? label}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                          P50: {v?.p50 != null ? (label === "Part. abates %" ? `${v.p50.toFixed(0)}%` : v.p50.toFixed(1)) : "—"}
                        </div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          P75: {v?.p75 != null ? (label === "Part. abates %" ? `${v.p75.toFixed(0)}%` : v.p75.toFixed(1)) : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TooltipProvider>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: match.idealBenchmarks != null ? 0.15 : 0.1 }}
        >
          <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} className="text-purple-400" />
                <span className="text-lg text-zinc-900 dark:text-zinc-100 font-semibold">Análise completa</span>
              </CardTitle>
              {match.analysis?.summary && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{match.analysis.summary}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {match.analysis?.insights && match.analysis.insights.length > 0 ? (
                <ul className="space-y-2">
                  {match.analysis.insights.map((insight, i) => {
                    const isGood = insight.interpretation.startsWith("above_") && insight.metric !== "deaths" || (insight.metric === "deaths" && insight.interpretation.startsWith("below_"));
                    const isWarn = insight.interpretation === "below_p50" && insight.metric !== "deaths" || (insight.metric === "deaths" && insight.interpretation === "above_p75");
                    const bg = isGood ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 dark:text-emerald-400" : isWarn ? "bg-amber-500/10 border-amber-500/20 text-amber-300 dark:text-amber-400" : "bg-zinc-50/50 border-zinc-200/80 dark:bg-white/5 dark:border-white/10";
                    return (
                      <li
                        key={i}
                        className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${bg}`}
                      >
                        <span>{insight.label}: {insight.value != null ? (insight.metric === "killParticipation" ? `${insight.value.toFixed(0)}%` : insight.value.toFixed(1)) : "—"}</span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          P50: {insight.p50 != null ? insight.p50.toFixed(1) : "—"} · P75: {insight.p75 != null ? insight.p75.toFixed(1) : "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Defina região e elo (Tier/Rank) no Dashboard para comparar com benchmarks.
                    {tips.length > 0 ? " Enquanto isso, dicas por regras fixas:" : ""}
                  </p>
                  {tips.length > 0 && (
                    <ul className="space-y-2 mt-2">
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
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <AppFooter />
    </div>
  );
}
