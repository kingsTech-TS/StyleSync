"use client";

import { Minus, Plus, ScanFace, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Doll } from "./doll";

export type Zoom = "full" | "upper" | "face";

const zoomStyle: Record<Zoom, string> = {
  full: "scale-100",
  upper: "scale-[1.7] translate-y-[24%]",
  face: "scale-[3.1] translate-y-[78%]",
};

interface DollStageProps {
  svg?: string | null;
  url?: string | null;
  alt: string;
  /** hero: big Create-a-character stage. card: feed/grid tile. thumb: tiny. */
  size?: "hero" | "card" | "thumb";
  zoom?: Zoom;
  /** Idle breathing + sway. */
  live?: boolean;
  className?: string;
  /** Overlays (status, badges, controls) drawn above the doll. */
  children?: React.ReactNode;
  dim?: boolean;
}

/**
 * The doll on a lit stage with a round platform and a soft contact shadow,
 * like a character creator. Every doll in the app goes through this.
 */
export function DollStage({
  svg,
  url,
  alt,
  size = "card",
  zoom = "full",
  live = false,
  className,
  children,
  dim,
}: DollStageProps) {
  const hero = size === "hero";
  return (
    <div
      className={cn(
        "doll-stage relative isolate overflow-hidden",
        size === "hero" && "rounded-[28px]",
        size === "card" && "rounded-[var(--radius-card)]",
        size === "thumb" && "rounded-xl",
        className,
      )}
    >
      {hero && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-3/4 bg-[radial-gradient(ellipse_30%_75%_at_50%_0%,rgb(255_255_255/0.5),transparent_70%)] [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_70%,transparent)] dark:bg-[radial-gradient(ellipse_30%_75%_at_50%_0%,rgb(255_255_255/0.07),transparent_70%)]"
        />
      )}
      {/* platform */}
      <div
        aria-hidden
        className={cn(
          "doll-platform absolute left-1/2 -translate-x-1/2 rounded-[50%] transition-opacity duration-500",
          hero ? "bottom-[3%] h-[9%] w-[62%]" : "bottom-[2%] h-[8%] w-[70%]",
          zoom !== "full" && "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "doll-shadow absolute left-1/2 -translate-x-1/2 rounded-[50%] transition-opacity duration-500",
          hero ? "bottom-[5.2%] h-[3.5%] w-[30%]" : "bottom-[4%] h-[3.5%] w-[34%]",
          live && "doll-live-shadow",
          zoom !== "full" && "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute inset-x-0 top-[4%] bottom-[5.5%] origin-bottom transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          zoomStyle[zoom],
        )}
      >
        <div className={cn("h-full w-full", live && "doll-live", dim && "opacity-40 blur-[1px] transition")}>
          <Doll svg={svg} url={url} alt={alt} className="doll-enter" />
        </div>
      </div>
      {children}
    </div>
  );
}

/** Full body / upper body / face camera, like a character creator's zoom. */
export function ZoomControl({ zoom, onChange }: { zoom: Zoom; onChange: (z: Zoom) => void }) {
  const order: Zoom[] = ["full", "upper", "face"];
  const i = order.indexOf(zoom);
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface/80 p-1 shadow-sm ring-1 ring-line backdrop-blur">
      <button
        type="button"
        aria-label="Zoom out"
        disabled={i === 0}
        onClick={() => onChange(order[Math.max(i - 1, 0)])}
        className="grid size-8 place-items-center rounded-full text-ink transition hover:bg-surface-2 disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        aria-label={zoom === "face" ? "Show full body" : "Show face"}
        onClick={() => onChange(zoom === "face" ? "full" : "face")}
        className="grid size-8 place-items-center rounded-full text-ink transition hover:bg-surface-2"
      >
        {zoom === "face" ? <UserRound className="size-4" /> : <ScanFace className="size-4" />}
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        disabled={i === order.length - 1}
        onClick={() => onChange(order[Math.min(i + 1, order.length - 1)])}
        className="grid size-8 place-items-center rounded-full text-ink transition hover:bg-surface-2 disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
