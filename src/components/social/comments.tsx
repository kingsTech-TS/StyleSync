"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ErrorNote, Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { CommentOut, OutfitOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "@/lib/queries/keys";
import { patchOutfitEverywhere } from "@/lib/queries/outfits";
import { timeAgo } from "@/lib/utils";
import { ReportDialog } from "./report-dialog";

const MAX = 500;

export function Comments({ outfit, isOwner }: { outfit: OutfitOut; isOwner: boolean }) {
  const id = outfit.id!;
  const qc = useQueryClient();
  const { status, user } = useAuth();
  const [text, setText] = useState("");
  const [closedReason, setClosedReason] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);

  const comments = useQuery({
    queryKey: qk.comments(id),
    queryFn: () => api<CommentOut[]>(`/social/outfits/${id}/comments`),
  });

  const bumpCount = (delta: number) =>
    patchOutfitEverywhere(qc, id, (o) => ({ ...o, comment_count: Math.max(o.comment_count + delta, 0) }));

  const add = useMutation({
    mutationFn: () => api<CommentOut>(`/social/outfits/${id}/comments`, { body: { text: text.trim() } }),
    onSuccess: (c) => {
      setText("");
      qc.setQueryData<CommentOut[]>(qk.comments(id), (list) => [...(list ?? []), c]);
      if (c.status === "hidden") toast("Your comment is awaiting review");
      else bumpCount(1);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 403) setClosedReason(e.message);
      else toast.error(errorMessage(e));
    },
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => api(`/social/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: (_d, commentId) => {
      const removed = comments.data?.find((c) => c.id === commentId);
      qc.setQueryData<CommentOut[]>(qk.comments(id), (list) => list?.filter((c) => c.id !== commentId));
      if (removed?.status === "visible") bumpCount(-1);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const list = comments.data ?? [];

  return (
    <section aria-labelledby="comments-title">
      <h2 id="comments-title" className="text-sm font-semibold">
        Comments{list.length > 0 && <span className="ml-1.5 font-normal text-muted">{list.length}</span>}
      </h2>

      {comments.isLoading ? (
        <div className="mt-4 flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-10 flex-1" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {outfit.comments_enabled ? "No comments yet." : "Comments are turned off for this outfit."}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-5">
          {list.map((c) => (
            <li key={c.id} className="group flex gap-3">
              <Link href={`/u/${c.username}`} className="shrink-0">
                <UserAvatar url={c.avatar_image_url} username={c.username} className="size-8" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[13px]">
                  <Link href={`/u/${c.username}`} className="font-medium">
                    @{c.username}
                  </Link>
                  <span className="ml-2 text-faint">{timeAgo(c.created_at)}</span>
                </p>
                <p className="mt-0.5 text-[14px] leading-relaxed break-words whitespace-pre-line">{c.text}</p>
                {c.status === "hidden" && <p className="mt-1 text-xs text-warn">Awaiting review. Only you can see this.</p>}
              </div>
              {status === "authenticated" && (
                <Menu>
                  <MenuTrigger
                    aria-label="Comment options"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted opacity-60 transition group-hover:opacity-100 hover:bg-surface-2"
                  >
                    <MoreHorizontal className="size-4" />
                  </MenuTrigger>
                  <MenuContent>
                    {(c.is_mine || isOwner) && (
                      <MenuItem danger onSelect={() => remove.mutate(c.id)}>
                        <Trash2 />
                        Delete
                      </MenuItem>
                    )}
                    {!c.is_mine && (
                      <MenuItem onSelect={() => setReporting(c.id)}>
                        <Flag />
                        Report
                      </MenuItem>
                    )}
                  </MenuContent>
                </Menu>
              )}
            </li>
          ))}
        </ul>
      )}

      {closedReason && <ErrorNote className="mt-4">{closedReason}</ErrorNote>}

      {outfit.comments_enabled && status === "authenticated" && !closedReason && (
        <form
          className="mt-5 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) add.mutate();
          }}
        >
          <UserAvatar url={user?.avatar_image_url} username={user?.username} className="size-8" />
          <div className="flex-1">
            <Textarea
              aria-label="Add a comment"
              placeholder="Add a comment"
              maxLength={MAX}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) add.mutate();
              }}
              className="min-h-11 resize-none py-2.5"
              rows={text.length > 60 ? 3 : 1}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-xs tabular-nums ${text.length > MAX - 40 ? "text-warn" : "text-faint"}`}>
                {text.length}/{MAX}
              </span>
              <Button type="submit" size="sm" disabled={!text.trim()} loading={add.isPending}>
                Post
              </Button>
            </div>
          </div>
        </form>
      )}

      {outfit.comments_enabled && status === "anonymous" && (
        <p className="mt-5 text-sm text-muted">
          <Link href="/login" className="font-medium text-ink underline underline-offset-4">
            Log in
          </Link>{" "}
          to comment.
        </p>
      )}

      {reporting && (
        <ReportDialog
          open
          onOpenChange={(o) => !o && setReporting(null)}
          targetType="comment"
          targetId={reporting}
        />
      )}
    </section>
  );
}
