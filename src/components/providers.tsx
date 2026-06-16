"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const storedTheme = window.localStorage.getItem("ajaia-theme");
      const currentTheme = document.documentElement.dataset.theme;
      const nextTheme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : currentTheme === "dark" ? "dark" : "light";
      setThemeState(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.dataset.theme = nextTheme;
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mounted,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        window.localStorage.setItem("ajaia-theme", nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
        document.documentElement.dataset.theme = nextTheme;
      },
    }),
    [mounted, theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster richColors position="top-right" />
    </ThemeContext.Provider>
  );
}

export function useAjaiaTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAjaiaTheme must be used inside Providers");
  return context;
}
