"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Check, CircleSlash, ExternalLink, Globe, RotateCw, SwatchBook } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { OutfitRender } from "@/components/doll/outfit-render";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { OutfitOut } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";
import { SLOT_LABELS } from "@/lib/slots";
import { titleCase } from "@/lib/utils";

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function MissingItems({ items }: { items: OutfitOut["missing_items"] }) {
  if (!items.length) return null;
  return (
    <Card className="border-dashed bg-transparent">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <CircleSlash className="size-4 text-muted" />
        Not in your wardrobe
      </h3>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((m, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <Badge className="mt-px shrink-0">{titleCase(m.category)}</Badge>
            <span className="text-muted">{m.description}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function OutfitResult({ outfit, onAgain }: { outfit: OutfitOut; onAgain: () => void }) {
  const qc = useQueryClient();
  const publish = useMutation({
    mutationFn: () => api<OutfitOut>(`/feed/outfits/${outfit.id}/publish`, { method: "POST" }),
    onSuccess: (o) => {
      qc.setQueryData(qk.outfit(o.id!), (prev: OutfitOut | undefined) => (prev ? { ...prev, ...o, render: prev.render } : o));
      qc.invalidateQueries({ queryKey: ["outfits"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Published to the feed");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (outfit.status === "not_possible" || !outfit.id) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="text-lg font-semibold tracking-tight">Not enough to work with</h2>
          <p className="mt-1.5 text-sm text-muted">
            {outfit.ai_rationale ||
              "Your wardrobe doesn't have the pieces this look needs. Nothing was saved."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/wardrobe">Add clothes</Link>
            </Button>
            <Button variant="secondary" onClick={onAgain}>
              Try different settings
            </Button>
          </div>
        </Card>
        <MissingItems items={outfit.missing_items} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <OutfitRender outfit={outfit} size="hero" live canRerender className="aspect-[3/4] w-full sm:aspect-[4/5]">
        <div className="absolute top-3 right-3 flex gap-1.5">
          {outfit.status === "partial" && <Badge tone="warn">Partial</Badge>}
          {outfit.is_published && (
            <Badge tone="success">
              <Check />
              Published
            </Badge>
          )}
        </div>
      </OutfitRender>

      <div className="flex flex-wrap gap-2">
        {!outfit.is_published && (
          <Button variant="accent" loading={publish.isPending} onClick={() => publish.mutate()}>
            <Globe />
            Publish
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link href={`/creation-room?outfit=${outfit.id}`}>
            <SwatchBook />
            Open in Creation Room
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/outfits/${outfit.id}`}>
            <ArrowUpRight />
            View
          </Link>
        </Button>
        <Button variant="ghost" onClick={onAgain}>
          <RotateCw />
          Again
        </Button>
      </div>

      {outfit.items.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold">What you&apos;re wearing</h3>
          <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
            {outfit.items.map((it) => (
              <li key={`${it.slot}-${it.item_id}`} className="flex gap-3.5 p-3.5">
                <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  {it.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{it.name ?? "Item"}</span>
                    <span className="shrink-0 text-xs text-muted">{SLOT_LABELS[it.slot]}</span>
                  </span>
                  {it.reason && <span className="mt-0.5 block text-[13px] text-muted">{it.reason}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <MissingItems items={outfit.missing_items} />

      {outfit.ai_rationale && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Why it works</h3>
          <p className="text-[15px] leading-relaxed text-ink/85">{outfit.ai_rationale}</p>
        </section>
      )}

      {outfit.tips.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Tips</h3>
          <ul className="flex flex-col gap-1.5">
            {outfit.tips.map((t, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] text-ink/85">
                <span className="mt-2.5 size-1 shrink-0 rounded-full bg-ink/40" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      {outfit.ai_sources.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Sources</h3>
          <div className="flex flex-wrap gap-2">
            {outfit.ai_sources.map((s) => (
              <a
                key={s}
                href={s}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] text-muted transition hover:border-ink/40 hover:text-ink"
              >
                {hostname(s)}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
