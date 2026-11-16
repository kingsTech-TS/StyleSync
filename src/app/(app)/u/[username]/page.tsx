"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Flag, LayoutGrid, MoreHorizontal, Settings } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DollStage } from "@/components/doll/doll-stage";
import { UserAvatar } from "@/components/layout/brand";
import { LoadMoreSentinel, OutfitGrid, OutfitGridSkeleton } from "@/components/outfit/outfit-grid";
import { FollowButton, useProfile } from "@/components/social/follow-button";
import { ReportDialog } from "@/components/social/report-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState, ErrorNote, Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/misc";
import { Skeleton, Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { FollowUser } from "@/lib/api/types";
import { useFeed } from "@/lib/queries/feed";
import { qk } from "@/lib/queries/keys";
import { plural } from "@/lib/utils";

export default function ProfilePage() {
  const { username: raw } = useParams<{ username: string }>();
  const username = decodeURIComponent(raw).toLowerCase();
  const profile = useProfile(username);
  const outfits = useFeed({ author: username });
  const [list, setList] = useState<"followers" | "following" | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (profile.isLoading) {
    return (
      <div className="flex items-center gap-6">
        <Skeleton className="size-28 rounded-full sm:size-36" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }
  if (profile.isError || !profile.data) {
    const missing = profile.error instanceof ApiError && profile.error.status === 404;
    return (
      <EmptyState
        title={missing ? "This account isn't available" : "Couldn't load this profile"}
        description={missing ? `There's no one called @${username}, or they aren't visible to you.` : errorMessage(profile.error)}
        action={
          <Button asChild variant="secondary">
            <Link href="/feed">Back to the feed</Link>
          </Button>
        }
      />
    );
  }

  const p = profile.data;
  const items = outfits.data?.pages.flatMap((pg) => pg.items) ?? [];

  return (
    <>
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end">
        <DollStage
          url={p.avatar_image_url}
          alt={`${p.username}'s doll`}
          size="card"
          zoom="upper"
          className="size-32 shrink-0 rounded-full! ring-4 ring-surface sm:size-40"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-4xl leading-none tracking-tight normal-case sm:text-5xl">@{p.username}</h1>
          {p.full_name && <p className="mt-2 text-muted">{p.full_name}</p>}
          <div className="mt-4 flex gap-5 text-sm">
            <button type="button" onClick={() => setList("followers")} className="hover:underline">
              <span className="font-semibold tabular-nums">{p.follower_count.toLocaleString()}</span>{" "}
              <span className="text-muted">{p.follower_count === 1 ? "follower" : "followers"}</span>
            </button>
            <button type="button" onClick={() => setList("following")} className="hover:underline">
              <span className="font-semibold tabular-nums">{p.following_count.toLocaleString()}</span>{" "}
              <span className="text-muted">following</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {p.is_self ? (
            <Button asChild variant="secondary">
              <Link href="/profile">
                <Settings />
                Edit profile
              </Link>
            </Button>
          ) : (
            <>
              <FollowButton username={p.username} />
              <Menu>
                <MenuTrigger
                  aria-label="More"
                  className="grid size-10 place-items-center rounded-full text-muted ring-1 ring-line transition hover:bg-surface-2 hover:text-ink"
                >
                  <MoreHorizontal className="size-[18px]" />
                </MenuTrigger>
                <MenuContent>
                  <MenuItem onSelect={() => setBlockOpen(true)} danger>
                    <Ban />
                    Block @{p.username}
                  </MenuItem>
                  {/* Reporting an account needs its id, which /users/{username} doesn't return yet. */}
                  {"id" in p && typeof p.id === "string" && (
                    <MenuItem onSelect={() => setReportOpen(true)}>
                      <Flag />
                      Report account
                    </MenuItem>
                  )}
                </MenuContent>
              </Menu>
            </>
          )}
        </div>
      </header>

      {p.is_self && <FollowRequests />}

      <h2 className="mb-5 text-sm font-semibold">Published outfits</h2>
      {outfits.isLoading ? (
        <OutfitGridSkeleton count={4} />
      ) : outfits.isError ? (
        <ErrorNote>{errorMessage(outfits.error)}</ErrorNote>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid />}
          title={p.is_self ? "You haven't published anything yet" : "No published outfits yet"}
          description={p.is_self ? "Open one of your outfits and publish it to show it here." : undefined}
          action={
            p.is_self ? (
              <Button asChild variant="secondary">
                <Link href="/outfits">My outfits</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <OutfitGrid outfits={items} />
          <LoadMoreSentinel
            hasMore={!!outfits.hasNextPage}
            loading={outfits.isFetchingNextPage}
            onLoad={() => !outfits.isFetchingNextPage && outfits.fetchNextPage()}
          />
        </>
      )}

      <PeopleDialog username={p.username} kind={list} onClose={() => setList(null)} />
      {"id" in p && typeof p.id === "string" && (
        <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType="user" targetId={p.id} />
      )}
      <BlockDialog username={p.username} open={blockOpen} onOpenChange={setBlockOpen} />
    </>
  );
}

function PeopleDialog({
  username,
  kind,
  onClose,
}: {
  username: string;
  kind: "followers" | "following" | null;
  onClose: () => void;
}) {
  const people = useQuery({
    queryKey: kind === "following" ? qk.following(username) : qk.followers(username),
    queryFn: () => api<FollowUser[]>(`/social/users/${encodeURIComponent(username)}/${kind}`),
    enabled: !!kind,
  });
  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={kind === "following" ? "Following" : "Followers"}>
        {people.isLoading ? (
          <div className="flex justify-center py-8 text-muted">
            <Spinner />
          </div>
        ) : !people.data?.length ? (
          <p className="py-6 text-center text-sm text-muted">
            {kind === "following" ? `@${username} isn't following anyone yet.` : "No followers yet."}
          </p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {people.data.map((u) => (
              <li key={u.username}>
                <Link
                  href={`/u/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-surface-2"
                >
                  <UserAvatar url={u.avatar_image_url} username={u.username} className="size-10" />
                  <span className="text-sm font-medium">@{u.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BlockDialog({
  username,
  open,
  onOpenChange,
}: {
  username: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const block = useMutation({
    mutationFn: () => api(`/social/users/${encodeURIComponent(username)}/block`, { method: "POST" }),
    onSuccess: () => {
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: qk.profile(username) });
      toast(`Blocked @${username}`, {
        action: {
          label: "Undo",
          onClick: () =>
            api(`/social/users/${encodeURIComponent(username)}/block`, { method: "DELETE" })
              .then(() => {
                qc.invalidateQueries({ queryKey: qk.profile(username) });
                qc.invalidateQueries({ queryKey: ["feed"] });
              })
              .catch((e) => toast.error(errorMessage(e))),
        },
      });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Block @${username}?`}
        description="You won't see each other's outfits, and they can't follow you, like or comment on your outfits."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={block.isPending} onClick={() => block.mutate()}>
            Block
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FollowRequests() {
  const qc = useQueryClient();
  const requests = useQuery({
    queryKey: qk.followRequests,
    queryFn: () => api<FollowUser[]>("/social/follow-requests"),
  });
  const answer = useMutation({
    mutationFn: ({ username, approve }: { username: string; approve: boolean }) =>
      api(`/social/follow-requests/${encodeURIComponent(username)}/${approve ? "approve" : "decline"}`, { method: "POST" }),
    onSuccess: (_d, { username }) => {
      qc.setQueryData<FollowUser[]>(qk.followRequests, (l) => l?.filter((u) => u.username !== username));
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: qk.me });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!requests.data?.length) return null;
  return (
    <section className="mb-10 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold">
        Follow requests <span className="ml-1 font-normal text-muted">{plural(requests.data.length, "person", "people")}</span>
      </h2>
      <ul className="mt-3 flex flex-col">
        {requests.data.map((u) => (
          <li key={u.username} className="flex items-center gap-3 py-2">
            <Link href={`/u/${u.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar url={u.avatar_image_url} username={u.username} className="size-10" />
              <span className="truncate text-sm font-medium">@{u.username}</span>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              disabled={answer.isPending}
              onClick={() => answer.mutate({ username: u.username, approve: false })}
            >
              Decline
            </Button>
            <Button size="sm" disabled={answer.isPending} onClick={() => answer.mutate({ username: u.username, approve: true })}>
              Approve
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
