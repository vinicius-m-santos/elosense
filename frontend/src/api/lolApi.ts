import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "";

export const lolApi = axios.create({ baseURL });

export type PlayerResponse = { puuid: string };

export type LeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export type PlayerRankResponse = { entries: LeagueEntry[] };

export type MetricBenchmark = { avg: number | null; p50: number | null; p75: number | null };

export type IdealBenchmarks = {
  sampleSize: number;
  csPerMin: MetricBenchmark;
  damagePerMin: MetricBenchmark;
  visionScore: MetricBenchmark;
  goldPerMin: MetricBenchmark;
  killParticipation: MetricBenchmark;
  deaths: MetricBenchmark;
};

export type AnalysisInsight = {
  metric: string;
  value: number | null;
  p50: number | null;
  p75: number | null;
  interpretation: string;
  label: string;
};

export type MatchAnalysis = {
  insights: AnalysisInsight[];
  summary: string;
};

export type MatchSummary = {
  matchId: string;
  champion: string;
  championId: number;
  result: boolean;
  kda: string;
  csPerMin: number;
  damagePerMin: number;
  visionScore: number;
  deaths: number;
  earlyDeaths: number;
  soloDeaths: number;
  killParticipation: number | null;
  goldPerMin: number | null;
  score: string;
  gameDuration: number | null;
  /** Match end time in ms (epoch). For ordering and "time ago" display. */
  gameEndTimestamp?: number | null;
  queueId?: number | null;
  teamPosition?: string | null;
  opponentChampionId?: number | null;
  tier?: string | null;
  rank?: string | null;
  idealBenchmarks?: IdealBenchmarks | null;
  analysis?: MatchAnalysis | null;
};

export type MatchesParams = { puuid: string; region?: string; tier?: string; rank?: string };

export async function fetchPlayer(gameName: string, tagLine: string): Promise<PlayerResponse> {
  const { data } = await lolApi.get<PlayerResponse>("/player", {
    params: { gameName, tagLine },
  });
  return data;
}

/** Get all league entries for the player (Solo, Flex, etc.). */
export async function fetchPlayerRank(puuid: string, region: string): Promise<PlayerRankResponse> {
  const { data } = await lolApi.get<PlayerRankResponse>("/player/rank", {
    params: { puuid, region },
  });
  return data;
}

export async function fetchMatches(params: MatchesParams): Promise<MatchSummary[]> {
  const { data } = await lolApi.get<MatchSummary[]>("/matches", {
    params: { puuid: params.puuid, region: params.region ?? undefined, tier: params.tier ?? undefined, rank: params.rank ?? undefined },
  });
  return data;
}

export async function fetchMatchDetail(
  matchId: string,
  puuid: string,
  opts?: { region?: string; tier?: string; rank?: string }
): Promise<MatchSummary> {
  const { data } = await lolApi.get<MatchSummary>(`/match/${matchId}`, {
    params: { puuid, region: opts?.region ?? undefined, tier: opts?.tier ?? undefined, rank: opts?.rank ?? undefined },
  });
  return data;
}

/** Tips from analysis insights when available, otherwise fixed rules (fallback). */
export function getMatchTips(m: MatchSummary): string[] {
  if (m.analysis?.insights?.length) {
    const tips: string[] = [];
    for (const i of m.analysis.insights) {
      if (i.interpretation === "below_p50" && i.metric !== "deaths") {
        tips.push(`${i.label} abaixo da mediana do elo`);
      } else if (i.interpretation === "above_p75" && i.metric === "deaths") {
        tips.push("Mortes acima do P75 do elo");
      } else if (i.interpretation === "above_p75") {
        tips.push(`${i.label} acima do P75 do elo`);
      } else if (i.interpretation === "below_p50" && i.metric === "deaths") {
        tips.push("Mortes acima da mediana do elo");
      }
    }
    return tips;
  }
  const fallback: string[] = [];
  if (m.csPerMin < 6) fallback.push("Seu farm está abaixo do ideal");
  if (m.deaths > 6) fallback.push("Você morreu mais do que deveria");
  if (m.visionScore < 15) fallback.push("Sua visão está baixa");
  return fallback;
}

/** One-line ideal/summary for dashboard: from analysis summary or benchmark sampleSize, or fallback text. */
export function getMatchIdealLabel(m: MatchSummary): string | null {
  if (m.analysis?.summary) return m.analysis.summary;
  if (m.idealBenchmarks?.sampleSize != null && m.idealBenchmarks.sampleSize > 0) {
    return `Ideal do elo (n=${m.idealBenchmarks.sampleSize})`;
  }
  return null;
}
