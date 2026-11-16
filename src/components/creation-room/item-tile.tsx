"use client";

import { useDraggable } from "@dnd-kit/core";
import { GarmentImage } from "@/components/wardrobe/garment-image";
import { Check } from "lucide-react";
import type { ItemOut } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function ItemTile({ item, worn, onToggle }: { item: ItemOut; worn: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, data: { item } });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={onToggle}
      aria-pressed={worn}
      aria-label={`${worn ? "Take off" : "Wear"} ${item.name}`}
      className={cn(
        "group relative flex touch-manipulation flex-col overflow-hidden rounded-2xl border bg-surface text-left transition",
        worn ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink/40",
        isDragging && "opacity-40",
      )}
    >
      <span className="relative aspect-square w-full overflow-hidden bg-surface-2">
        <GarmentImage item={item} alt="" className="p-1.5 transition duration-300 group-hover:scale-[1.04]" draggable={false} />
        {worn && (
          <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-ink text-bg shadow">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5 px-2 py-1.5">
        {item.color_hex && (
          <span className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: item.color_hex }} />
        )}
        <span className="truncate text-xs">{item.name}</span>
      </span>
    </button>
  );
}
