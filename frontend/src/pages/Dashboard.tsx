"use client";

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Trophy,
  TrendingUp,
  Target,
  Sword,
  Moon,
  Sun,
  ChevronRight,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { fetchMatches, getMatchTips, type MatchSummary } from "@/api/lolApi";
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

function storePlayer(puuid: string, gameName: string, tagLine: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ puuid, gameName, tagLine }));
}

export default function DashboardConsistent() {
  const [dark, setDark] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as
    | { puuid: string; gameName: string; tagLine: string; matches: MatchSummary[] }
    | undefined;

  const [puuid, setPuuid] = useState<string | null>(state?.puuid ?? null);
  const [gameName, setGameName] = useState(state?.gameName ?? "");
  const [tagLine, setTagLine] = useState(state?.tagLine ?? "");
  const [matches, setMatches] = useState<MatchSummary[]>(state?.matches ?? []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (state?.puuid) {
      setPuuid(state.puuid);
      setGameName(state.gameName);
      setTagLine(state.tagLine);
      setMatches(state.matches);
      storePlayer(state.puuid, state.gameName, state.tagLine);
    } else {
      const stored = getStoredPlayer();
      if (stored?.puuid) {
        setPuuid(stored.puuid);
        setGameName(stored.gameName);
        setTagLine(stored.tagLine);
      }
    }
  }, [state]);

  useEffect(() => {
    if (puuid && matches?.length === 0) {
      setLoading(true);
      fetchMatches(puuid)
        .then(setMatches)
        .finally(() => setLoading(false));
    }
  }, [puuid, matches?.length]);

  const isDark = dark;
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textSecondary = isDark ? "text-zinc-400" : "text-zinc-600";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-500";
  const bgMain = isDark ? "bg-zinc-950" : "bg-zinc-100";
  const glassCard = isDark
    ? "bg-white/5 border-white/10 backdrop-blur-xl"
    : "bg-white/80 border-zinc-200/80 backdrop-blur-xl";
  const inputClass = isDark
    ? "bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-500"
    : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-500";

  const filteredMatches = searchQuery.trim()
    ? matches.filter(
      (m) =>
        m.champion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.matchId.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : matches;

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

  const winBadge = (result: boolean) =>
    result
      ? "bg-emerald-500/20 text-emerald-300 dark:text-emerald-400 border-emerald-500/30"
      : "bg-red-500/20 text-red-300 dark:text-red-400 border-red-500/30";

  const avgScore =
    matches?.length > 0
      ? matches.reduce((acc, m) => {
        const v = { S: 5, A: 4, B: 3, C: 2, D: 1 }[m.score] ?? 0;
        return acc + v;
      }, 0) / matches.length
      : 0;
  const avgScoreLabel = avgScore >= 4.5 ? "S" : avgScore >= 3.5 ? "A" : avgScore >= 2.5 ? "B" : avgScore >= 1.5 ? "C" : "D";
  const wins = matches?.filter((m) => m.result).length ?? 0;
  const winrate = matches?.length > 0 ? Math.round((wins / matches.length) * 100) : 0;
  const avgKda =
    matches?.length > 0
      ? (
        matches.reduce((acc, m) => {
          const [k, d, a] = m.kda.split("/").map((n) => parseInt(n.trim(), 10) || 0);
          return acc + (d > 0 ? (k + a) / d : k + a);
        }, 0) / matches.length
      ).toFixed(1)
      : "0";
  const avgCs =
    matches?.length > 0
      ? (matches.reduce((acc, m) => acc + m.csPerMin, 0) / matches.length).toFixed(1)
      : "0";

  if (!puuid) {
    return (
      <div className={`min-h-screen w-full ${bgMain} ${textPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <p className={textMuted}>Nenhum jogador carregado.</p>
          <Button
            className="mt-4"
            onClick={() => navigate("/")}
          >
            Buscar Riot ID
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${bgMain} ${textPrimary}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <header
        className={`relative z-10 border-b backdrop-blur-xl ${isDark ? "border-white/5" : "border-zinc-200/80"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <Zap className="h-5 w-5 text-purple-400" />
            EloSense
            <Badge className="ml-2 bg-purple-500/10 text-purple-400 border-purple-500/20">
              Dashboard
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Sun className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
            <Switch checked={dark} onCheckedChange={setDark} />
            <Moon className={`h-4 w-4 ${isDark ? "opacity-60 text-zinc-400" : "text-zinc-600"}`} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border border-white/10">
              <AvatarImage src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/1.png`} />
              <AvatarFallback className="bg-purple-500/20 text-purple-300">
                {gameName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{gameName}#{tagLine}</div>
              <div className={`text-sm ${textSecondary}`}>
                Score médio {avgScoreLabel} • {winrate}% Winrate
              </div>
            </div>
          </div>
          <div className="relative w-64">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`}
            />
            <Input
              placeholder="Buscar partida"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${inputClass} focus-visible:ring-purple-500`}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Score médio", value: avgScoreLabel, icon: Trophy },
            { label: "KDA médio", value: avgKda, icon: Sword },
            { label: "CS/min", value: avgCs, icon: Target },
            { label: "Winrate", value: `${winrate}%`, icon: TrendingUp },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={glassCard}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className={`text-sm ${textSecondary}`}>{stat.label}</div>
                    <div className="text-xl font-semibold">{stat.value}</div>
                  </div>
                  <stat.icon className="w-5 h-5 text-purple-400" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className={glassCard}>
          <CardHeader>
            <CardTitle>Histórico recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className={`flex items-center justify-center py-12 ${textMuted}`}>
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                Calculando métricas…
              </div>
            ) : (
              filteredMatches.map((match) => {
                const tips = getMatchTips(match);
                return (
                  <motion.div
                    key={match.matchId}
                    whileHover={{ y: -2 }}
                    className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80"} transition cursor-pointer backdrop-blur-xl`}
                    onClick={() =>
                      navigate(`/match/${match.matchId}`, {
                        state: { puuid, gameName, tagLine },
                      })
                    }
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${match.champion}.png`}
                        alt=""
                        className="w-12 h-12 rounded-lg border border-white/10 object-cover bg-zinc-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/48?text=Champ";
                        }}
                      />
                      <div>
                        <div className="font-medium">{match.champion}</div>
                        <div className={`text-sm ${textSecondary}`}>
                          {match.kda} • {match.csPerMin} CS/min
                        </div>
                        <div className={`text-xs ${textMuted} mt-0.5`}>
                          {getQueueType(match.queueId)}
                        </div>
                        {tips.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tips.map((tip, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-0.5 text-xs text-amber-400 dark:text-amber-400"
                              >
                                <AlertCircle className="w-3 h-3" />
                                {tip}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={scoreBadge(match.score)}>{match.score}</Badge>
                      <Badge className={winBadge(match.result)}>
                        {match.result ? "Vitória" : "Derrota"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`${textSecondary} hover:bg-white/10`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/match/${match.matchId}`, {
                            state: { puuid, gameName, tagLine },
                          });
                        }}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>

      <footer
        className={`relative z-10 border-t py-6 text-center text-sm ${textMuted} ${isDark ? "border-white/5" : "border-zinc-200/80"}`}
      >
        © 2026 EloSense
      </footer>
    </div>
  );
}
