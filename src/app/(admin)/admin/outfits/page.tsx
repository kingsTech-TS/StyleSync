"use client";

import { EyeOff, Heart, LayoutGrid, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { OutfitRender } from "@/components/doll/outfit-render";
import { UserAvatar } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Badge, EmptyState, ErrorNote, PageHeader } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/api/errors";
import type { OutfitOut } from "@/lib/api/types";
import { usePublishedOutfits, useTakeDown } from "@/lib/queries/admin";
import { timeAgo, titleCase } from "@/lib/utils";

export default function AdminPublished() {
  const { data, isLoading, error } = usePublishedOutfits();
  const [target, setTarget] = useState<OutfitOut | null>(null);
  const takeDown = useTakeDown();

  return (
    <>
      <PageHeader
        title="Published outfits"
        description={data ? `${data.length.toLocaleString()} live in the feed, newest first.` : undefined}
      />
      {error && <ErrorNote>{errorMessage(error)}</ErrorNote>}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState icon={<LayoutGrid />} title="Nothing published yet" />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((o) => (
            <li key={o.id} className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <Link href={`/outfits/${o.id}`} className="block">
                <OutfitRender outfit={o} size="card" className="aspect-[3/4] rounded-none" />
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-3.5">
                {o.author && (
                  <Link href={`/u/${o.author.username}`} className="flex items-center gap-2 text-sm">
                    <UserAvatar url={o.author.avatar_image_url} username={o.author.username} className="size-7" />
                    <span className="truncate font-medium">@{o.author.username}</span>
                  </Link>
                )}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  {o.context.theme && <Badge>{titleCase(o.context.theme)}</Badge>}
                  <span>{timeAgo(o.published_at)}</span>
                </div>
                <p className="flex gap-3 text-xs text-muted tabular-nums">
                  <span className="flex items-center gap-1">
                    <Heart className="size-3.5" /> {o.like_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="size-3.5" /> {o.comment_count}
                  </span>
                </p>
                <Button variant="secondary" size="sm" className="mt-auto text-danger" onClick={() => setTarget(o)}>
                  <EyeOff />
                  Take down
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        {target && (
          <DialogContent
            title="Take this outfit down?"
            description={`It leaves the feed for everyone${target.author ? `, and @${target.author.username} can't publish it again` : ""}.`}
          >
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="danger"
                loading={takeDown.isPending}
                onClick={() => takeDown.mutate(target.id!, { onSuccess: () => setTarget(null) })}
              >
                Take down
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
