"use client";

import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Swatch } from "./palettes";

interface Props {
  label: string;
  swatches: Swatch[];
  value: string | undefined;
  onChange: (hex: string) => void;
  size?: "md" | "lg";
}

/** A row of round color swatches plus a custom picker, like a character creator. */
export function SwatchPicker({ label, swatches, value, onChange, size = "md" }: Props) {
  const current = value?.toLowerCase();
  const custom = current && !swatches.some((s) => s.hex === current);
  const dim = size === "lg" ? "size-11" : "size-9";
  return (
    <fieldset>
      <legend className="mb-3 text-[13px] font-medium">
        {label}
        <span className="ml-2 font-normal text-muted">
          {swatches.find((s) => s.hex === current)?.name ?? (custom ? current : "")}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={label}>
        {swatches.map((s) => {
          const on = s.hex === current;
          return (
            <button
              key={s.hex}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={s.name}
              title={s.name}
              onClick={() => onChange(s.hex)}
              className={cn(
                "rounded-full ring-offset-2 ring-offset-surface transition hover:scale-105",
                dim,
                on ? "ring-2 ring-ink" : "ring-1 ring-black/10",
              )}
              style={{ background: s.hex }}
            />
          );
        })}
        <label
          title="Custom color"
          className={cn(
            "relative grid cursor-pointer place-items-center rounded-full ring-offset-2 ring-offset-surface transition hover:scale-105",
            dim,
            custom ? "ring-2 ring-ink" : "ring-1 ring-line",
          )}
          style={custom ? { background: current } : undefined}
        >
          <Pipette className={cn("size-4", custom ? "text-white mix-blend-difference" : "text-muted")} />
          <span className="sr-only">Custom {label.toLowerCase()}</span>
          <input
            type="color"
            value={current ?? "#888888"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer rounded-full opacity-0"
          />
        </label>
      </div>
    </fieldset>
  );
}
