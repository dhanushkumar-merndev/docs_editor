"use client";

import { Moon, Sun } from "lucide-react";
import { useAjaiaTheme } from "@/components/providers";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { mounted, theme, setTheme } = useAjaiaTheme();
  const isDark = mounted && theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="cursor-pointer rounded-full"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
