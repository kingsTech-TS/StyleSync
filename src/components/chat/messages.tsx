"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import { OutfitRender } from "@/components/doll/outfit-render";
import { Skeleton } from "@/components/ui/spinner";
import { useOutfit } from "@/lib/queries/shared";
import { cn, plural } from "@/lib/utils";

const md: Components = {
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0 marker:text-faint">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0 marker:text-faint">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:decoration-ink">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  h1: ({ children }) => <h3 className="mt-4 mb-2 font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-4 mb-2 font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h3 className="mt-4 mb-2 font-semibold first:mt-0">{children}</h3>,
  code: ({ children }) => <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
  blockquote: ({ children }) => <blockquote className="mb-3 border-l-2 border-line pl-3 text-muted">{children}</blockquote>,
  img: () => null,
};

export function UserMessage({ text, images }: { text: string; images: string[] }) {
  return (
    <div className="flex flex-col items-end gap-2">
      {images.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="Attached photo" className="h-32 w-24 rounded-2xl object-cover ring-1 ring-line sm:h-40 sm:w-30" />
          ))}
        </div>
      )}
      {text && (
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-ink px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-bg sm:max-w-[75%]">
          {text}
        </div>
      )}
    </div>
  );
}

export function StylistMark() {
  return (
    <span
      aria-hidden
      className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-[15px] leading-none text-ink italic ring-1 ring-line"
    >
      s
    </span>
  );
}

interface AssistantMessageProps {
  text: string;
  outfitIds: string[];
  status?: string | null;
  error?: string | null;
  stopped?: boolean;
  live?: boolean;
}

export function AssistantMessage({ text, outfitIds, status, error, stopped, live }: AssistantMessageProps) {
  return (
    <div className="flex gap-3">
      <StylistMark />
      <div className="min-w-0 flex-1 pt-0.5" aria-live={live ? "polite" : undefined} aria-busy={live && !!status}>
        {text && (
          <div className="text-[15px] text-ink">
            <Markdown components={md} skipHtml>
              {text}
            </Markdown>
          </div>
        )}
        {status && <ToolStatus label={status} />}
        {outfitIds.length > 0 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {outfitIds.map((id) => (
              <ChatOutfitCard key={id} id={id} />
            ))}
          </div>
        )}
        {stopped && <p className="mt-2 text-[13px] text-muted">Stopped.</p>}
        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ToolStatus({ label }: { label: string }) {
  return (
    <div className="mt-1 flex items-center gap-2.5 text-sm text-muted">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-pulse rounded-full bg-faint"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
      {label}
    </div>
  );
}

/** An outfit the stylist made, on the doll. Polls until the render is done. */
export function ChatOutfitCard({ id }: { id: string }) {
  const { data, isError } = useOutfit(id);
  const shell = "w-[200px] shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface sm:w-[220px]";
  if (isError) {
    return <div className={cn(shell, "p-4 text-sm text-muted")}>This outfit is no longer available.</div>;
  }
  if (!data) {
    return (
      <div className={shell}>
        <Skeleton className="aspect-[3/4] rounded-none" />
        <div className="space-y-2 p-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }
  const missing = data.missing_items.length;
  return (
    <Link href={`/outfits/${id}`} className={cn(shell, "group block transition hover:border-ink/30")}>
      <OutfitRender outfit={data} size="card" className="aspect-[3/4] rounded-none" />
      <div className="p-3">
        <p className="truncate text-sm font-medium group-hover:underline group-hover:underline-offset-4">
          {data.name ?? "Outfit"}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {plural(data.items.length, "piece")}
          {missing > 0 && <span className="text-warn"> · {missing} not in your wardrobe</span>}
        </p>
      </div>
    </Link>
  );
}
