import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BRANDS } from "@/lib/bi/brands";
import type { PeriodState } from "@/lib/bi/period";

type Theme = "dark" | "light";

type AppState = {
  period: PeriodState;
  setPeriod: (p: PeriodState) => void;
  brandId: string;
  setBrandId: (id: string) => void;
  theme: Theme;
  toggleTheme: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodState>({ key: "30d" });
  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ period, setPeriod, brandId, setBrandId, theme, toggleTheme }),
    [period, brandId, theme, toggleTheme],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

/** Inline script that applies the saved theme before paint (default: dark). */
export const THEME_SCRIPT = `(function(){try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}})();`;
