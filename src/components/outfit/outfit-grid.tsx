"use client";

import { useEffect, useRef } from "react";
import { Skeleton, Spinner } from "@/components/ui/spinner";
import type { OutfitOut } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { OutfitCard } from "./outfit-card";

const GRID = "grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4";

export function OutfitGrid({
  outfits,
  variant = "social",
  className,
}: {
  outfits: OutfitOut[];
  variant?: "social" | "mine";
  className?: string;
}) {
  return (
    <div className={cn(GRID, className)}>
      {outfits.map((o, i) => (
        <OutfitCard key={o.id ?? i} outfit={o} variant={variant} />
      ))}
    </div>
  );
}

export function OutfitGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID} aria-busy aria-label="Loading outfits">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[3/4] rounded-[var(--radius-card)]" />
          <Skeleton className="mt-3 h-4 w-2/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Loads the next page when it scrolls into view. */
export function LoadMoreSentinel({
  hasMore,
  loading,
  onLoad,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoad: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onLoad);
  cb.current = onLoad;

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) cb.current();
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore]);

  if (!hasMore && !loading) return null;
  return (
    <div ref={ref} className="flex justify-center py-10 text-muted">
      {loading && <Spinner />}
    </div>
  );
}
