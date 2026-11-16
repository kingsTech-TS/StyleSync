"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Cutouts known to load, shared by every tile on the page: cutout url → url that worked.
const ready = new Map<string, string>();
// Cloudinary answers 423 while it builds a cutout (usually a few seconds); retry on this schedule.
const RETRY_MS = [0, 2500, 5000, 10000, 20000];

interface GarmentImageProps {
  item: { image_url: string; cutout_url?: string | null };
  alt: string;
  className?: string;
  /** Prefer the background-removed cutout (tiles, doll). Off = always the original photo. */
  cutout?: boolean;
  draggable?: boolean;
}

/**
 * A wardrobe item's picture. Shows the original photo straight away and swaps in the
 * background-removed cutout once it has loaded, so a tile is never blank or broken
 * while Cloudinary is still building the cutout.
 */
export function GarmentImage({ item, alt, className, cutout = true, draggable }: GarmentImageProps) {
  const cutoutUrl = cutout && item.cutout_url && item.cutout_url !== item.image_url ? item.cutout_url : null;
  const [src, setSrc] = useState(() => (cutoutUrl && ready.get(cutoutUrl)) || item.image_url);

  useEffect(() => {
    setSrc((cutoutUrl && ready.get(cutoutUrl)) || item.image_url);
    if (!cutoutUrl || ready.has(cutoutUrl)) return;

    let cancelled = false;
    const timers: number[] = [];
    const attempt = (i: number) => {
      if (cancelled || i >= RETRY_MS.length) return;
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          const known = ready.get(cutoutUrl);
          if (known) return setSrc(known);
          // A query string makes the browser re-request instead of reusing the cached 423.
          const url = i === 0 ? cutoutUrl : `${cutoutUrl}${cutoutUrl.includes("?") ? "&" : "?"}r=${i}`;
          const probe = new Image();
          probe.onload = () => {
            ready.set(cutoutUrl, url);
            if (!cancelled) setSrc(url);
          };
          probe.onerror = () => attempt(i + 1);
          probe.src = url;
        }, RETRY_MS[i]),
      );
    };
    attempt(0);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [cutoutUrl, item.image_url]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={draggable}
      className={cn("h-full w-full object-contain transition-opacity duration-300", className)}
      onError={() => {
        // A cached cutout url went bad: fall back to the photo.
        if (src !== item.image_url) setSrc(item.image_url);
      }}
    />
  );
}
