import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StoredPlayer = {
  puuid: string;
  gameName: string;
  tagLine: string;
  region?: string;
  tier?: string;
  rank?: string;
} | null;

type PlayerState = {
  player: StoredPlayer;
  setPlayer: (player: StoredPlayer) => void;
  clearPlayer: () => void;
  getPlayer: () => StoredPlayer;
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      player: null,

      setPlayer(player) {
        set({ player });
      },

      clearPlayer() {
        set({ player: null });
      },

      getPlayer() {
        return get().player;
      },
    }),
    {
      name: "elosense-player",
    }
  )
);
