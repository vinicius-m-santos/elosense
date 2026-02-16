"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { useThemeStore } from "@/stores/themeStore";

type ThemeContextType = {
  dark: boolean;
  setDark: (value: boolean) => void;
  onDarkChange: (checked: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dark = useThemeStore((s) => s.dark);
  const setDarkStore = useThemeStore((s) => s.setDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const setDark = useCallback(
    (value: boolean) => {
      setDarkStore(value);
    },
    [setDarkStore]
  );

  const onDarkChange = useCallback(
    (checked: boolean) => {
      setDark(checked);
    },
    [setDark]
  );

  return (
    <ThemeContext.Provider value={{ dark, setDark, onDarkChange }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
