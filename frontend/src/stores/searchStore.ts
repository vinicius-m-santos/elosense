import { create } from "zustand";
import { persist } from "zustand/middleware";

const FREE_SEARCHES_LIMIT = 3;

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

type SearchState = {
  date: string;
  count: number;
  getFreeSearchCount: () => number;
  incrementFreeSearch: () => void;
  canSearch: () => boolean;
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      date: "",
      count: 0,

      getFreeSearchCount() {
        const { date, count } = get();
        if (date !== getToday()) return 0;
        return count;
      },

      incrementFreeSearch() {
        const today = getToday();
        const current = get().getFreeSearchCount();
        set({
          date: today,
          count: Math.min(current + 1, FREE_SEARCHES_LIMIT),
        });
      },

      canSearch() {
        return get().getFreeSearchCount() < FREE_SEARCHES_LIMIT;
      },
    }),
    {
      name: "elosense-free-searches",
      partialize: (state) => ({ date: state.date, count: state.count }),
    }
  )
);
