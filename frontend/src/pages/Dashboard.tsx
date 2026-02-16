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
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMatches, fetchPlayer, getMatchTips, getMatchIdealLabel, type MatchSummary, type LeagueEntry, type PlayerResponse } from "@/api/lolApi";
import { getQueueType, getRankQueueLabel, getLaneLabel } from "@/utils/getQueueType";
import { formatMatchDate } from "@/utils/dateUtils";
import { AppHeader } from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter/AppFooter";
import { usePlayerStore } from "@/stores/playerStore";
import { Skeleton, SkeletonCard, SkeletonMatchList } from "@/components/ui/skeleton";

const DEFAULT_REGION = "BR1";
const RANKED_SOLO = "RANKED_SOLO_5x5";

export default function DashboardConsistent() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as
    | { player: PlayerResponse; region?: string; matches: MatchSummary[] }
    | { puuid: string; gameName: string; tagLine: string; region?: string; matches: MatchSummary[] }
    | undefined;

  const storedPlayer = usePlayerStore((s) => s.player);
  const setPlayerStore = usePlayerStore((s) => s.setPlayer);
  const [puuid, setPuuid] = useState<string | null>(
    (state && "player" in state ? state.player.puuid : state?.puuid) ?? storedPlayer?.puuid ?? null
  );
  const [gameName, setGameName] = useState(
    (state && "player" in state ? state.player.name : state?.gameName) ?? storedPlayer?.gameName ?? ""
  );
  const [tagLine, setTagLine] = useState(
    (state && "player" in state ? state.player.tag : state?.tagLine) ?? storedPlayer?.tagLine ?? ""
  );
  const [region, setRegion] = useState(
    (state && "player" in state ? (state.region ?? state.player.queueRanks?.[0]?.region) : state?.region) ?? storedPlayer?.region ?? DEFAULT_REGION
  );
  const [rankEntries, setRankEntries] = useState<LeagueEntry[]>([]);
  const [profileIconId, setProfileIconId] = useState<number | null>(null);
  const [rankLoaded, setRankLoaded] = useState(false);
  const [matches, setMatches] = useState<MatchSummary[]>(state?.matches ?? []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sortMatchesByTime = (list: MatchSummary[]) =>
    [...list].sort((a, b) => (b.gameEndTimestamp ?? 0) - (a.gameEndTimestamp ?? 0));

  useEffect(() => {
    if (state && "player" in state) {
      const p = state.player;
      setPuuid(p.puuid);
      setGameName(p.name);
      setTagLine(p.tag);
      setRegion(state.region ?? p.queueRanks?.[0]?.region ?? DEFAULT_REGION);
      setMatches(sortMatchesByTime(state.matches ?? []));
      setRankEntries(
        (p.queueRanks ?? []).map((qr) => ({
          queueType: qr.queueType,
          tier: qr.tier,
          rank: qr.rank,
        }))
      );
      setProfileIconId(p.profileIconId ?? null);
      setRankLoaded(true);
      setPlayerStore({
        puuid: p.puuid,
        gameName: p.name,
        tagLine: p.tag,
        region: state.region ?? p.queueRanks?.[0]?.region ?? DEFAULT_REGION,
      });
    } else if (state?.puuid) {
      setPuuid(state.puuid);
      setGameName(state.gameName);
      setTagLine(state.tagLine);
      setRegion(state.region ?? DEFAULT_REGION);
      setMatches(sortMatchesByTime(state.matches ?? []));
      setPlayerStore({
        puuid: state.puuid,
        gameName: state.gameName,
        tagLine: state.tagLine,
        region: state.region ?? DEFAULT_REGION,
      });
    } else {
      const stored = usePlayerStore.getState().getPlayer();
      if (stored?.puuid) {
        setPuuid(stored.puuid);
        setGameName(stored.gameName);
        setTagLine(stored.tagLine);
        setRegion(stored.region ?? DEFAULT_REGION);
      }
    }
  }, [state, setPlayerStore]);

  useEffect(() => {
    const hasPlayerFromState = state && "player" in state;
    if (hasPlayerFromState) return;
    if (!puuid || rankLoaded) return;
    const g = (gameName || storedPlayer?.gameName) ?? "";
    const t = (tagLine || storedPlayer?.tagLine) ?? "";
    if (!g || !t) return;
    fetchPlayer(g, t, region || DEFAULT_REGION)
      .then((p) => {
        setRankEntries(
          (p.queueRanks ?? []).map((qr) => ({ queueType: qr.queueType, tier: qr.tier, rank: qr.rank }))
        );
        setProfileIconId(p.profileIconId ?? null);
      })
      .catch(() => {
        setRankEntries([]);
        setProfileIconId(null);
      })
      .finally(() => setRankLoaded(true));
  }, [state, puuid, gameName, tagLine, region, rankLoaded, storedPlayer?.gameName, storedPlayer?.tagLine]);

  useEffect(() => {
    if (!puuid || !region) return;
    const shouldRefetch = matches.length === 0;
    if (!shouldRefetch) return;
    setLoading(true);
    fetchMatches({ puuid, region })
      .then((data) => setMatches(sortMatchesByTime(data)))
      .finally(() => setLoading(false));
  }, [puuid, region, matches.length]);

  const filteredMatches = (() => {
    const list = searchQuery.trim()
      ? matches.filter(
        (m) =>
          m.champion.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.matchId.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : [...matches];
    list.sort((a, b) => (b.gameEndTimestamp ?? 0) - (a.gameEndTimestamp ?? 0));
    return list;
  })();

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
      <div className="min-h-screen w-full bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500">Nenhum jogador carregado.</p>
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
    <div className="min-h-screen w-full bg-zinc-100 text-zinc-900 transition-colors duration-500 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <AppHeader
        backTo="/"
        badgeLabel="Dashboard"
        maxWidth="max-w-7xl"
      />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {!rankLoaded ? (
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            ) : (
              <Avatar className="w-12 h-12 border border-white/10">
                <AvatarImage
                  src={`https://ddragon-webp.lolmath.net/latest/img/profileicon/${profileIconId ?? 1}.webp`}
                  alt={`${gameName} avatar`}
                />
                <AvatarFallback className="bg-purple-500/20 text-purple-300">
                  {gameName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="font-semibold">{gameName}#{tagLine}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Score médio {avgScoreLabel} • {winrate}% taxa de vitória
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-zinc-500">Região: {region}</span>
                {rankLoaded && rankEntries.length === 0 && (
                  <span className="text-xs text-amber-500 dark:text-amber-400">
                    Nenhuma fila ranqueada
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            />
            <Input
              placeholder="Buscar partida por campeão ou ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-purple-500 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        {!rankLoaded && (
          <div className="w-full md:w-auto flex flex-wrap gap-3">
            <SkeletonCard className="min-w-[180px] flex-1" />
            <SkeletonCard className="min-w-[180px] flex-1" />
          </div>
        )}
        {rankLoaded && rankEntries.length > 0 && (
          <div className="w-full md:w-auto flex flex-wrap gap-3">
            {rankEntries.map((entry) => (
              <Card key={entry.queueType} className="flex-1 w-full max-w-full md:w-auto min-w-[180px] md:max-w-[240px] border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-zinc-500 mb-1">
                    {getRankQueueLabel(entry.queueType)}
                  </div>
                  <div className="font-semibold text-purple-600 dark:text-purple-300">
                    {entry.tier} {entry.rank}
                    {entry.leaguePoints != null && (
                      <span className="text-sm font-normal ml-1 text-zinc-600 dark:text-zinc-400">
                        {entry.leaguePoints} LP
                      </span>
                    )}
                  </div>
                  {(entry.wins != null || entry.losses != null) && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {(entry.wins ?? 0)}V {(entry.losses ?? 0)}D
                      {(entry.wins ?? 0) + (entry.losses ?? 0) > 0 && (
                        <span className="ml-1">
                          ({(100 * (entry.wins ?? 0) / ((entry.wins ?? 0) + (entry.losses ?? 0))).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {rankLoaded && rankEntries.length === 0 && (
          <div
            className="rounded-xl border p-4 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-200"
            role="alert"
          >
            <p className="font-medium">Você não está ranqueado em nenhuma fila.</p>
            <p className="text-sm mt-1 opacity-90">
              Os benchmarks por elo estão disponíveis apenas para contas ranqueadas (Solo ou Flex). Suas métricas continuam visíveis; a comparação com o ideal do elo não será exibida.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4">
          {!rankLoaded ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            [
              { label: "Score médio", value: avgScoreLabel, icon: Trophy },
              { label: "KDA médio", value: avgKda, icon: Sword },
              { label: "CS/min", value: avgCs, icon: Target },
              { label: "Taxa de vitória", value: `${winrate}%`, icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</div>
                      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{stat.value}</div>
                    </div>
                    <stat.icon className="w-5 h-5 text-purple-400" />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <Card className="border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="text-zinc-900 dark:text-zinc-100">Histórico recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading || !rankLoaded ? (
              <SkeletonMatchList count={5} />
            ) : (
              filteredMatches.map((match) => {
                const tips = getMatchTips(match);
                return (
                  <motion.div
                    key={match.matchId}
                    whileHover={{ y: -2 }}
                    className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition cursor-pointer backdrop-blur-xl"
                    onClick={() =>
                      navigate(`/match/${match.matchId}`, {
                        state: { puuid, gameName, tagLine, region, tier: match.tier ?? undefined, rank: match.rank ?? undefined },
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
                            "";
                        }}
                      />
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{match.champion}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {match.kda} • {match.csPerMin} CS/min
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {getQueueType(match.queueId)}
                          {getLaneLabel(match.teamPosition) && (
                            <> • {getLaneLabel(match.teamPosition)}</>
                          )}
                          {formatMatchDate(match.gameEndTimestamp) && (
                            <> • {formatMatchDate(match.gameEndTimestamp)}</>
                          )}
                        </div>
                        {(match.tier ?? match.rank) && getMatchIdealLabel(match) && (
                          <div className="text-xs mt-1 text-purple-600 dark:text-purple-300">
                            Ideal do elo: {getMatchIdealLabel(match)}
                          </div>
                        )}
                        {/* {tips.length > 0 && (
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
                        )} */}
                      </div>
                    </div>
                    <div className="flex w-full md:w-auto justify-end md:justify-start md:items-center gap-3">
                      <Badge className={scoreBadge(match.score)}>{match.score}</Badge>
                      <Badge className={winBadge(match.result)}>
                        {match.result ? "Vitória" : "Derrota"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-600 dark:text-zinc-400 hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/match/${match.matchId}`, {
                            state: { puuid, gameName, tagLine, region, tier: match.tier ?? undefined, rank: match.rank ?? undefined },
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

      <AppFooter />
    </div>
  );
}
