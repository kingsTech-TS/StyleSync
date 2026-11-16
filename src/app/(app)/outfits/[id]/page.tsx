"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CloudSun,
  ExternalLink,
  Flag,
  Globe,
  GlobeLock,
  MoreHorizontal,
  Moon,
  Pencil,
  RotateCw,
  Sun,
  Thermometer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { Zoom } from "@/components/doll/doll-stage";
import { ZoomControl } from "@/components/doll/doll-stage";
import { OutfitRender, RerenderButton } from "@/components/doll/outfit-render";
import { UserAvatar } from "@/components/layout/brand";
import { LikeButton, SaveButton } from "@/components/outfit/outfit-actions";
import { SOURCE_LABEL, useThemeName } from "@/components/outfit/outfit-card";
import { Comments } from "@/components/social/comments";
import { FollowButton } from "@/components/social/follow-button";
import { ReportDialog } from "@/components/social/report-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Badge,
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Switch,
} from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { OutfitOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "@/lib/queries/keys";
import { patchOutfitEverywhere, removeOutfitEverywhere } from "@/lib/queries/outfits";
import { useAvatar, useOutfit } from "@/lib/queries/shared";
import { timeAgo, titleCase } from "@/lib/utils";

export default function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const outfit = useOutfit(id);
  const avatar = useAvatar();
  const [zoom, setZoom] = useState<Zoom>("full");

  if (outfit.isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="aspect-[3/4] max-h-[80dvh] rounded-[28px]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }
  if (outfit.isError || !outfit.data) {
    const notFound = outfit.error instanceof ApiError && outfit.error.status === 404;
    return (
      <EmptyState
        title={notFound ? "This outfit isn't available" : "Couldn't load this outfit"}
        description={notFound ? "It may have been deleted or made private." : errorMessage(outfit.error)}
        action={
          <Button variant="secondary" onClick={() => router.back()}>
            Go back
          </Button>
        }
      />
    );
  }

  const o = outfit.data;
  const isOwner = !o.author || o.author.username === user?.username;
  const staleRender =
    isOwner &&
    o.render.status === "done" &&
    !!avatar.data &&
    o.render.avatar_render_version != null &&
    o.render.avatar_render_version < avatar.data.render_version;

  return (
    <>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div className="lg:sticky lg:top-8">
          <OutfitRender
            outfit={o}
            size="hero"
            zoom={zoom}
            live
            canRerender={isOwner}
            className="mx-auto aspect-[3/4] max-h-[82dvh] w-full"
          >
            <div className="absolute top-3 right-3">
              <ZoomControl zoom={zoom} onChange={setZoom} />
            </div>
          </OutfitRender>
          {staleRender && o.id && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 pl-4 text-[13px]">
              <span className="text-muted">Your doll changed since this was rendered.</span>
              <RerenderButton outfitId={o.id} label="Re-render" />
            </div>
          )}
        </div>

        <OutfitPanel outfit={o} isOwner={isOwner} />
      </div>
    </>
  );
}

function OutfitPanel({ outfit: o, isOwner }: { outfit: OutfitOut; isOwner: boolean }) {
  const themeName = useThemeName();
  const theme = themeName(o.context.theme);

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
          {SOURCE_LABEL[o.source]} · {timeAgo(o.published_at ?? o.created_at)}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none tracking-tight sm:text-5xl">{o.name ?? "Untitled outfit"}</h1>

        {o.author && !isOwner && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <Link href={`/u/${o.author.username}`} className="flex min-w-0 items-center gap-2.5">
              <UserAvatar url={o.author.avatar_image_url} username={o.author.username} className="size-10" />
              <span className="truncate text-sm font-medium">@{o.author.username}</span>
            </Link>
            <FollowButton username={o.author.username} size="sm" />
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {theme && <Badge>{theme}</Badge>}
          {o.context.weather && (
            <Badge>
              <CloudSun />
              {titleCase(o.context.weather)}
            </Badge>
          )}
          {o.context.temperature_c != null && (
            <Badge>
              <Thermometer />
              {Math.round(o.context.temperature_c)}°C
            </Badge>
          )}
          {o.context.time_of_day && (
            <Badge>
              {o.context.time_of_day === "night" ? <Moon /> : <Sun />}
              {titleCase(o.context.time_of_day)}
            </Badge>
          )}
          {isOwner && o.is_published && (
            <Badge tone="ink">
              <Globe />
              Published
            </Badge>
          )}
        </div>
      </div>

      <Actions outfit={o} isOwner={isOwner} />

      {o.missing_items.length > 0 && (
        <section className="rounded-2xl bg-warn-soft p-4">
          <h2 className="text-sm font-semibold text-warn">Not in your wardrobe</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {o.missing_items.map((m, i) => (
              <li key={i}>
                <span className="font-medium">{titleCase(m.category)}:</span> <span className="text-muted">{m.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold">
          Pieces <span className="ml-1 font-normal text-muted">{o.items.length}</span>
        </h2>
        <ul className="mt-3 divide-y divide-line">
          {o.items.map((item) => (
            <li key={`${item.slot}-${item.item_id}`} className="flex gap-3.5 py-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[11px] font-medium tracking-wider text-faint uppercase">{titleCase(item.slot.replace(/_\d$/, ""))}</p>
                <p className="truncate text-[14px] font-medium">{item.name ?? "Removed item"}</p>
                {item.reason && <p className="mt-0.5 text-[13px] leading-snug text-muted">{item.reason}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {o.ai_rationale && (
        <section>
          <h2 className="text-sm font-semibold">Why it works</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{o.ai_rationale}</p>
        </section>
      )}

      {o.tips.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">Styling tips</h2>
          <ul className="mt-2 flex flex-col gap-2 text-[14px] text-muted">
            {o.tips.map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-faint" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      {o.ai_sources.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">Sources</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {o.ai_sources.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-muted underline decoration-line underline-offset-4 hover:text-ink"
                >
                  <span className="truncate">{hostname(url)}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {o.is_published && o.id && <Comments outfit={o} isOwner={isOwner} />}
    </div>
  );
}

function hostname(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname.length > 1 ? u.pathname : "");
  } catch {
    return url;
  }
}

function Actions({ outfit: o, isOwner }: { outfit: OutfitOut; isOwner: boolean }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const id = o.id!;

  const applyServer = (next: OutfitOut) => {
    qc.setQueryData<OutfitOut>(qk.outfit(id), (prev) => (prev ? { ...next, render: next.render.svg ? next.render : prev.render } : next));
    patchOutfitEverywhere(qc, id, (prev) => ({ ...prev, is_published: next.is_published, published_at: next.published_at, author: next.author, comments_enabled: next.comments_enabled }));
    qc.invalidateQueries({ queryKey: ["feed"] });
  };

  const publish = useMutation({
    mutationFn: () => api<OutfitOut>(`/feed/outfits/${id}/publish`, { body: { comments_enabled: allowComments } }),
    onSuccess: (next) => {
      applyServer(next);
      setPublishOpen(false);
      toast.success("Published to the feed");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const unpublish = useMutation({
    mutationFn: () => api<OutfitOut>(`/feed/outfits/${id}/unpublish`, { method: "POST" }),
    onSuccess: (next) => {
      applyServer(next);
      toast("Removed from the feed");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => api(`/outfits/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      removeOutfitEverywhere(qc, id);
      toast("Outfit deleted");
      router.replace("/outfits");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!isOwner) {
    return (
      <div className="flex items-center gap-2">
        <LikeButton outfit={o} size="md" />
        <SaveButton outfit={o} size="md" />
        <Menu>
          <MenuTrigger
            aria-label="More"
            className="ml-auto grid size-10 place-items-center rounded-full text-muted ring-1 ring-line transition hover:bg-surface-2 hover:text-ink"
          >
            <MoreHorizontal className="size-[18px]" />
          </MenuTrigger>
          <MenuContent>
            <MenuItem onSelect={() => setReportOpen(true)}>
              <Flag />
              Report outfit
            </MenuItem>
          </MenuContent>
        </Menu>
        <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType="outfit" targetId={id} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {o.is_published ? (
        <Button variant="secondary" loading={unpublish.isPending} onClick={() => unpublish.mutate()}>
          <GlobeLock />
          Unpublish
        </Button>
      ) : (
        <Button
          onClick={() => {
            setAllowComments(o.comments_enabled);
            setPublishOpen(true);
          }}
        >
          <Globe />
          Publish
        </Button>
      )}
      <Button asChild variant="secondary">
        <Link href={`/creation-room?outfit=${id}`}>
          <Pencil />
          Edit a copy
        </Link>
      </Button>
      {o.is_published && (
        <div className="flex items-center">
          <LikeButton outfit={o} />
          <SaveButton outfit={o} />
        </div>
      )}
      <Menu>
        <MenuTrigger
          aria-label="More"
          className="ml-auto grid size-10 place-items-center rounded-full text-muted ring-1 ring-line transition hover:bg-surface-2 hover:text-ink"
        >
          <MoreHorizontal className="size-[18px]" />
        </MenuTrigger>
        <MenuContent>
          <RerenderMenuItem outfitId={id} />
          <MenuSeparator />
          <MenuItem danger onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete outfit
          </MenuItem>
        </MenuContent>
      </Menu>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent
          title="Publish to the feed"
          description="Everyone can see this outfit on your doll, with your username. You can unpublish any time."
        >
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4">
            <span>
              <span className="block text-sm font-medium">Allow comments</span>
              <span className="block text-[13px] text-muted">You can delete any comment on your outfit.</span>
            </span>
            <Switch checked={allowComments} onCheckedChange={setAllowComments} label="Allow comments" />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button loading={publish.isPending} onClick={() => publish.mutate()}>
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          title="Delete this outfit?"
          description={
            o.is_published
              ? "It will be removed from the feed, along with its likes, comments and saves. This can't be undone."
              : "This can't be undone. The clothes stay in your wardrobe."
          }
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RerenderMenuItem({ outfitId }: { outfitId: string }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => api<OutfitOut["render"]>(`/outfits/${outfitId}/render`, { method: "POST" }),
    onSuccess: (render) => {
      qc.setQueryData<OutfitOut>(qk.outfit(outfitId), (o) => (o ? { ...o, render } : o));
      qc.invalidateQueries({ queryKey: qk.outfit(outfitId) });
      qc.invalidateQueries({ queryKey: ["outfits"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <MenuItem onSelect={() => m.mutate()}>
      <RotateCw />
      Re-render on my doll
    </MenuItem>
  );
}
