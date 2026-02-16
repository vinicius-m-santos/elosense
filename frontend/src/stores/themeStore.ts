import { create } from "zustand";
import { persist } from "zustand/middleware";

const THEME_KEY = "elosense-theme";

const themeStorage = {
  getItem: (name: string): string | null => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.dark !== undefined) return raw;
    } catch {
      // Old format: plain "light" or "dark" string
      if (raw === "light" || raw === '"light"') {
        return JSON.stringify({ state: { dark: false }, version: 0 });
      }
      if (raw === "dark" || raw === '"dark"') {
        return JSON.stringify({ state: { dark: true }, version: 0 });
      }
    }
    return raw;
  },
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};

type ThemeState = {
  dark: boolean;
  setDark: (value: boolean) => void;
  toggleDark: () => void;
  getDark: () => boolean;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      dark: true,

      setDark(value) {
        set({ dark: value });
      },

      toggleDark() {
        set((s) => ({ dark: !s.dark }));
      },

      getDark() {
        return get().dark;
      },
    }),
    {
      name: THEME_KEY,
      storage: {
        getItem: themeStorage.getItem,
        setItem: themeStorage.setItem,
        removeItem: themeStorage.removeItem,
      },
      partialize: (state) => ({ dark: state.dark }),
    }
  )
);
