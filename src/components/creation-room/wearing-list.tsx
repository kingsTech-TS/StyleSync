"use client";

import { X } from "lucide-react";
import { GarmentImage } from "@/components/wardrobe/garment-image";
import type { ItemOut, Slot } from "@/lib/api/types";
import { SLOT_LABELS, SLOT_ORDER, type Wearing } from "@/lib/slots";
import { cn } from "@/lib/utils";

interface Props {
  wearing: Wearing;
  byId: Map<string, ItemOut>;
  onRemove: (slot: Slot) => void;
}

/** Desktop: every slot as a row, empty ones dimmed. */
export function WearingList({ wearing, byId, onRemove }: Props) {
  return (
    <ul className="flex flex-col gap-1">
      {SLOT_ORDER.map((slot) => {
        const item = wearing[slot] ? byId.get(wearing[slot]!) : undefined;
        return (
          <li
            key={slot}
            className={cn(
              "flex items-center gap-3 rounded-2xl p-1.5 pr-2 transition",
              item ? "bg-surface ring-1 ring-line" : "opacity-60",
            )}
          >
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl",
                item ? "bg-surface-2" : "border border-dashed border-line",
              )}
            >
              {item && (
                <GarmentImage item={item} alt="" className="p-0.5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] tracking-wide text-muted uppercase">{SLOT_LABELS[slot]}</span>
              <span className={cn("block truncate text-sm", !item && "text-faint")}>{item?.name ?? "Empty"}</span>
            </span>
            {item && (
              <button
                type="button"
                onClick={() => onRemove(slot)}
                aria-label={`Take off ${item.name}`}
                className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Mobile: only what's worn, as a horizontal strip. */
export function WearingStrip({ wearing, byId, onRemove }: Props) {
  const worn = SLOT_ORDER.filter((s) => wearing[s] && byId.get(wearing[s]!));
  if (!worn.length) return <p className="px-4 text-[13px] text-muted">Tap or drag clothes onto your doll.</p>;
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto px-4">
      {worn.map((slot) => {
        const item = byId.get(wearing[slot]!)!;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onRemove(slot)}
            aria-label={`Take off ${item.name}`}
            className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface ring-1 ring-line"
          >
            <GarmentImage item={item} alt="" className="p-1" />
            <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-ink text-bg">
              <X className="size-2.5" strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
