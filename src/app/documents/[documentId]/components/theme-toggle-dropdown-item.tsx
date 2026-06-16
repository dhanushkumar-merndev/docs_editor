"use client";

import { Moon, Sun } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAjaiaTheme } from "@/components/providers";

// Provides the editor profile-menu item for toggling between light and dark themes.
export function ThemeToggleDropdownItem() {
  const { mounted, theme, setTheme } = useAjaiaTheme();
  const isDark = mounted && theme === "dark";
  return (
    <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {isDark ? "Light mode" : "Dark mode"}
    </DropdownMenuItem>
  );
}
