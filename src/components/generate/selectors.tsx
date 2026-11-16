"use client";

import {
  Cloud,
  CloudRain,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
  SunMedium,
  ThermometerSnowflake,
  Wind,
} from "lucide-react";
import type { OptionTheme } from "@/lib/api/types";
import { cn, titleCase } from "@/lib/utils";

export const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  hot: Sun,
  warm: SunMedium,
  mild: CloudSun,
  cool: Cloud,
  cold: ThermometerSnowflake,
  rainy: CloudRain,
  snowy: Snowflake,
  windy: Wind,
};

export function ThemePicker({
  themes,
  value,
  onChange,
}: {
  themes: OptionTheme[];
  value: string | null;
  onChange: (slug: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {themes.map((t) => {
        const selected = value === t.slug;
        return (
          <button
            key={t.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.slug)}
            className={cn(
              "flex min-h-[76px] flex-col items-start rounded-2xl border bg-surface px-3.5 py-3 text-left transition",
              selected ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40",
            )}
          >
            <span className="text-sm font-medium">{t.name}</span>
            {t.description && <span className="mt-0.5 line-clamp-2 text-xs text-muted">{t.description}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function WeatherPicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (w: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Weather" className="flex flex-wrap gap-2">
      {options.map((w) => {
        const Icon = WEATHER_ICONS[w] ?? Cloud;
        const selected = value === w;
        return (
          <button
            key={w}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(w)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition",
              selected ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink/40",
            )}
          >
            <Icon className="size-4" />
            {titleCase(w)}
          </button>
        );
      })}
    </div>
  );
}

export function DayNightToggle({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Time of day" className="inline-flex rounded-full bg-surface-2 p-1">
      {options.map((o) => {
        const selected = value === o;
        const Icon = o === "night" ? Moon : Sun;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition",
              selected ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {titleCase(o)}
          </button>
        );
      })}
    </div>
  );
}
