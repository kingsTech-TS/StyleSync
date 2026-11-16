"use client";

import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { OutfitOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { useToggleLike, useToggleSave } from "@/lib/queries/feed";
import { cn } from "@/lib/utils";

type Props = { outfit: Pick<OutfitOut, "id" | "liked_by_me" | "like_count" | "saved_by_me" | "save_count">; size?: "sm" | "md" };

function useSignedIn() {
  const { status } = useAuth();
  const router = useRouter();
  return () => {
    if (status === "authenticated") return true;
    router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    return false;
  };
}

export function LikeButton({ outfit, size = "sm" }: Props) {
  const like = useToggleLike();
  const signedIn = useSignedIn();
  if (!outfit.id) return null;
  const on = outfit.liked_by_me;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Unlike" : "Like"}
      onClick={() => signedIn() && like.mutate({ id: outfit.id!, like: !on })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full tabular-nums transition hover:text-ink",
        size === "sm" ? "h-8 px-2 text-[13px]" : "h-10 px-3.5 text-sm ring-1 ring-line hover:bg-surface-2",
        on ? "text-accent hover:text-accent" : "text-muted",
      )}
    >
      <Heart className={cn(size === "sm" ? "size-[17px]" : "size-[18px]", on && "fill-current")} />
      {outfit.like_count > 0 && outfit.like_count.toLocaleString()}
      {size === "md" && outfit.like_count === 0 && "Like"}
    </button>
  );
}

export function SaveButton({ outfit, size = "sm" }: Props) {
  const save = useToggleSave();
  const signedIn = useSignedIn();
  if (!outfit.id) return null;
  const on = outfit.saved_by_me;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save"}
      onClick={() => signedIn() && save.mutate({ id: outfit.id!, save: !on })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full tabular-nums transition hover:text-ink",
        size === "sm" ? "h-8 px-2 text-[13px]" : "h-10 px-3.5 text-sm ring-1 ring-line hover:bg-surface-2",
        on ? "text-ink" : "text-muted",
      )}
    >
      <Bookmark className={cn(size === "sm" ? "size-[17px]" : "size-[18px]", on && "fill-current")} />
      {size === "md" ? (on ? "Saved" : "Save") : outfit.save_count > 0 && outfit.save_count.toLocaleString()}
    </button>
  );
}

export function CommentCount({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex h-8 items-center gap-1.5 px-2 text-[13px] text-muted tabular-nums" aria-label={`${count} comments`}>
      <MessageCircle className="size-[17px]" />
      {count.toLocaleString()}
    </span>
  );
}
