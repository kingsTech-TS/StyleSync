"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pipette } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { AvatarOut } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";
import { cn } from "@/lib/utils";

export const HAIR_COLORS = [
  { hex: "#1b1210", name: "Black" },
  { hex: "#3b2416", name: "Dark brown" },
  { hex: "#6b3e26", name: "Brown" },
  { hex: "#a5683a", name: "Light brown" },
  { hex: "#d9b26f", name: "Blonde" },
  { hex: "#b5452f", name: "Auburn" },
  { hex: "#9a9a9a", name: "Grey" },
  { hex: "#e8e2d6", name: "Platinum" },
];

/** Hair color is a plain SVG fill change on the backend: instant and free. */
export function HairSwatches({ current, className }: { current?: string | null; className?: string }) {
  const qc = useQueryClient();
  const timer = useRef<number | undefined>(undefined);
  const m = useMutation({
    mutationFn: (hair_color: string) => api<AvatarOut>("/avatar", { method: "PATCH", body: { hair_color } }),
    onMutate: (hex) => {
      const prev = qc.getQueryData<AvatarOut>(qk.avatar);
      if (prev) qc.setQueryData<AvatarOut>(qk.avatar, { ...prev, features: { ...prev.features, hair_color: hex } });
      return { prev };
    },
    onSuccess: (a) => {
      qc.setQueryData(qk.avatar, a);
      qc.invalidateQueries({ queryKey: ["cr-preview"] });
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.avatar, ctx.prev);
      toast.error(errorMessage(e));
    },
  });

  const active = current?.toLowerCase();
  return (
    <div
      role="radiogroup"
      aria-label="Hair color"
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-surface/85 p-1.5 shadow-sm ring-1 ring-line backdrop-blur",
        className,
      )}
    >
      {HAIR_COLORS.map((c) => (
        <button
          key={c.hex}
          type="button"
          role="radio"
          aria-checked={active === c.hex}
          aria-label={c.name}
          title={c.name}
          disabled={m.isPending}
          onClick={() => m.mutate(c.hex)}
          className={cn(
            "size-6 rounded-full ring-1 ring-black/15 transition hover:scale-110",
            active === c.hex && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
          )}
          style={{ background: c.hex }}
        />
      ))}
      <label
        className="relative grid size-6 cursor-pointer place-items-center rounded-full text-muted transition hover:text-ink"
        title="Custom color"
      >
        <Pipette className="size-3.5" />
        <input
          type="color"
          aria-label="Custom hair color"
          className="absolute inset-0 cursor-pointer opacity-0"
          defaultValue={current ?? "#3b2416"}
          onChange={(e) => {
            const hex = e.target.value.toLowerCase();
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => m.mutate(hex), 350);
          }}
        />
      </label>
    </div>
  );
}
