"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import { OutfitRender } from "@/components/doll/outfit-render";
import { UserAvatar } from "@/components/layout/brand";
import { Badge } from "@/components/ui/misc";
import type { OutfitOut } from "@/lib/api/types";
import { useOptions } from "@/lib/queries/shared";
import { timeAgo, titleCase } from "@/lib/utils";
import { CommentCount, LikeButton, SaveButton } from "./outfit-actions";

export const SOURCE_LABEL: Record<string, string> = {
  ai_generated: "Styled by AI",
  creation_room: "Creation Room",
  chat: "From chat",
};

export function useThemeName() {
  const { data } = useOptions();
  return (slug: string | null | undefined) => {
    if (!slug) return null;
    return data?.themes.find((t) => t.slug === slug)?.name ?? titleCase(slug);
  };
}

/**
 * A tile in the feed and outfit grids. `variant="mine"` shows status and publish badges
 * instead of the author row.
 */
export function OutfitCard({ outfit, variant = "social" }: { outfit: OutfitOut; variant?: "social" | "mine" }) {
  const themeName = useThemeName();
  const theme = themeName(outfit.context.theme);
  const href = outfit.id ? `/outfits/${outfit.id}` : "#";

  return (
    <article className="group flex flex-col">
      <Link href={href} className="relative block rounded-[var(--radius-card)] focus-visible:outline-offset-4">
        <OutfitRender
          outfit={outfit}
          size="card"
          className="aspect-[3/4] w-full transition duration-300 group-hover:shadow-[0_12px_32px_-16px_rgb(0_0_0/0.35)]"
        >
          {variant === "mine" && (
            <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
              {outfit.is_published && (
                <Badge tone="ink">
                  <Globe />
                  Published
                </Badge>
              )}
              {outfit.missing_items.length > 0 && <Badge tone="warn">Missing pieces</Badge>}
            </div>
          )}
          {theme && variant === "social" && (
            <span className="absolute bottom-3 left-3 rounded-full bg-surface/85 px-2.5 py-1 text-[11px] font-medium ring-1 ring-line backdrop-blur">
              {theme}
            </span>
          )}
        </OutfitRender>
      </Link>

      {variant === "social" ? (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {outfit.author ? (
            <Link href={`/u/${outfit.author.username}`} className="flex min-w-0 items-center gap-2 py-1 pl-0.5">
              <UserAvatar url={outfit.author.avatar_image_url} username={outfit.author.username} className="size-7" />
              <span className="truncate text-[13px] font-medium">@{outfit.author.username}</span>
            </Link>
          ) : (
            <span className="truncate text-[13px] font-medium">{outfit.name ?? "Outfit"}</span>
          )}
          <div className="-mr-2 flex shrink-0 items-center">
            <LikeButton outfit={outfit} />
            <SaveButton outfit={outfit} />
            <CommentCount count={outfit.comment_count} />
          </div>
        </div>
      ) : (
        <div className="mt-2.5 px-0.5">
          <p className="truncate text-[14px] font-medium">{outfit.name ?? "Untitled outfit"}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-muted">
            {[SOURCE_LABEL[outfit.source], theme, timeAgo(outfit.created_at)].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </article>
  );
}
