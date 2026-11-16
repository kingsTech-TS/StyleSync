"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { THEME_KEY as KEY } from "@/lib/theme";

type Theme = "system" | "light" | "dark";

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      // storage unavailable
    }
  }, []);
  const change = (t: Theme) => {
    setTheme(t);
    apply(t);
    try {
      if (t === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {
      // storage unavailable
    }
  };
  return { theme, setTheme: change };
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun />, label: "Light" },
    { value: "system", icon: <Monitor />, label: "System" },
    { value: "dark", icon: <Moon />, label: "Dark" },
  ];
  return (
    <div className="flex rounded-full bg-surface-2 p-0.5" role="radiogroup" aria-label="Theme">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          aria-label={o.label}
          onClick={() => setTheme(o.value)}
          className="grid size-7 place-items-center rounded-full text-muted transition aria-checked:bg-surface aria-checked:text-ink aria-checked:shadow-sm [&_svg]:size-3.5"
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
