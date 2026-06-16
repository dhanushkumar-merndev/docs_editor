"use client";

import { Moon, Sun } from "lucide-react";
import { useAjaiaTheme } from "@/components/providers";

export function ThemeToggle() {
  const { mounted, theme, setTheme } = useAjaiaTheme();
  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
