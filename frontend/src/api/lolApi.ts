import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "";

export const lolApi = axios.create({ baseURL });

export type PlayerResponse = { puuid: string };

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
  queueId?: number | null;
};

export async function fetchPlayer(gameName: string, tagLine: string): Promise<PlayerResponse> {
  const { data } = await lolApi.get<PlayerResponse>("/player", {
    params: { gameName, tagLine },
  });
  return data;
}

export async function fetchMatches(puuid: string): Promise<MatchSummary[]> {
  const { data } = await lolApi.get<MatchSummary[]>("/matches", {
    params: { puuid },
  });
  return data;
}

export async function fetchMatchDetail(matchId: string, puuid: string): Promise<MatchSummary> {
  const { data } = await lolApi.get<MatchSummary>(`/match/${matchId}`, {
    params: { puuid },
  });
  return data;
}

export function getMatchTips(m: MatchSummary): string[] {
  const tips: string[] = [];
  if (m.csPerMin < 6) tips.push("Seu farm está abaixo do ideal");
  if (m.deaths > 6) tips.push("Você morreu mais do que deveria");
  if (m.visionScore < 15) tips.push("Sua visão está baixa");
  return tips;
}
