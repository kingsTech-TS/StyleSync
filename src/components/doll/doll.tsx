"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { qk } from "@/lib/queries/keys";
import { prepareSvg, svgSourceFor } from "@/lib/svg";
import { cn } from "@/lib/utils";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

interface DollProps {
  /** Inline SVG markup (preferred). */
  svg?: string | null;
  /** Hosted copy, used when there is no SVG string. */
  url?: string | null;
  alt: string;
  className?: string;
}

/** Draws a doll from SVG markup or a hosted image, filling its box from the bottom up. */
export function Doll({ svg, url, alt, className }: DollProps) {
  const mounted = useMounted();
  const source = svg ? null : svgSourceFor(url);
  const fetched = useQuery({
    queryKey: qk.svg(source ?? ""),
    queryFn: async () => {
      const res = await fetch(source!);
      if (!res.ok) throw new Error("svg fetch failed");
      const text = await res.text();
      if (!text.includes("<svg")) throw new Error("not an svg");
      return text;
    },
    enabled: !!source && mounted,
    staleTime: Infinity,
    retry: false,
  });

  const markup = svg ?? fetched.data ?? null;
  const html = useMemo(() => (mounted && markup ? prepareSvg(markup) : ""), [markup, mounted]);

  if (html) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("h-full w-full [&>svg]:h-full [&>svg]:w-full", className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  if (url && (!source || fetched.isError)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={cn("h-full w-full object-contain object-bottom", className)} />;
  }
  return <div aria-label={alt} className={cn("h-full w-full", className)} />;
}
