"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { GarmentImage } from "@/components/wardrobe/garment-image";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Eraser, Save, Search, Shirt, Undo2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DollStage, ZoomControl, type Zoom } from "@/components/doll/doll-stage";
import { HairSwatches } from "@/components/creation-room/hair-swatches";
import { RAIL, type RailKey } from "@/components/creation-room/icons";
import { ItemTile } from "@/components/creation-room/item-tile";
import { SaveDialog } from "@/components/creation-room/save-dialog";
import { WearingList, WearingStrip } from "@/components/creation-room/wearing-list";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNote, Tip } from "@/components/ui/misc";
import { Skeleton, Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { ItemOut, PreviewOut, Slot } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";
import { useAvatar, useOptions, useOutfit } from "@/lib/queries/shared";
import { itemsToWearing, slotOf, toggleWear, type Wearing, wearingToItems } from "@/lib/slots";
import { cn } from "@/lib/utils";

export default function CreationRoomPage() {
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <CreationRoom />
    </Suspense>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

function CreationRoom() {
  const remixId = useSearchParams().get("outfit");
  const avatar = useAvatar();
  const options = useOptions();
  const items = useQuery({ queryKey: qk.items({}), queryFn: () => api<ItemOut[]>("/items") });
  const remix = useOutfit(remixId);

  const [wearing, setWearing] = useState<Wearing>({});
  const [history, setHistory] = useState<Wearing[]>([]);
  const [rail, setRail] = useState<RailKey>("all");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState<Zoom>("full");
  const [saveOpen, setSaveOpen] = useState(false);
  const [dragging, setDragging] = useState<ItemOut | null>(null);

  const byId = useMemo(() => new Map((items.data ?? []).map((i) => [i.id, i])), [items.data]);

  const update = useCallback((next: Wearing | ((w: Wearing) => Wearing)) => {
    setWearing((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      if (value !== prev) setHistory((h) => [...h.slice(-29), prev]);
      return value;
    });
  }, []);

  // Remix: load an existing outfit's pieces (only those still in the wardrobe), once.
  const loadedRemix = useRef<string | null>(null);
  useEffect(() => {
    if (!remixId || !remix.data || !items.data || loadedRemix.current === remixId) return;
    loadedRemix.current = remixId;
    const owned = remix.data.items.filter((i) => byId.has(i.item_id));
    setWearing(itemsToWearing(owned.map((i) => ({ item_id: i.item_id, slot: i.slot }))));
    setHistory([]);
  }, [remixId, remix.data, items.data, byId]);

  const toggle = useCallback((item: ItemOut) => update((w) => toggleWear(w, item)), [update]);
  const removeSlot = useCallback(
    (slot: Slot) =>
      update((w) => {
        const next = { ...w };
        delete next[slot];
        return next;
      }),
    [update],
  );
  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      setWearing(h[h.length - 1]);
      return h.slice(0, -1);
    });
  };

  // Live preview: a free layered render on the backend, debounced while the user taps around.
  const selection = useMemo(() => wearingToItems(wearing), [wearing]);
  const debounced = useDebounced(selection, 400);
  const preview = useQuery({
    queryKey: ["cr-preview", debounced, avatar.data?.render_version, avatar.data?.features.hair_color],
    queryFn: () => api<PreviewOut>("/outfits/preview", { body: { items: debounced } }),
    enabled: debounced.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const stageSvg = selection.length === 0 ? avatar.data?.svg : (preview.data?.svg ?? avatar.data?.svg);
  const updating = selection.length > 0 && (preview.isFetching || debounced !== selection);
  const problems = selection.length > 0 ? (preview.data?.problems ?? []) : [];

  const visible = useMemo(() => {
    const cats = RAIL.find((r) => r.key === rail)?.categories ?? [];
    const q = search.trim().toLowerCase();
    return (items.data ?? []).filter(
      (i) =>
        (cats.length === 0 || cats.includes(i.category)) &&
        (!q || i.name.toLowerCase().includes(q) || i.primary_color.toLowerCase().includes(q)),
    );
  }, [items.data, rail, search]);

  const counts = useMemo(() => {
    const c: Partial<Record<RailKey, number>> = { all: items.data?.length ?? 0 };
    for (const r of RAIL) if (r.key !== "all") c[r.key] = (items.data ?? []).filter((i) => r.categories.includes(i.category)).length;
    return c;
  }, [items.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // No KeyboardSensor: Enter/Space on a tile should wear it, not start a drag.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );
  const onDragStart = (e: DragStartEvent) => setDragging((e.active.data.current?.item as ItemOut) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const item = e.active.data.current?.item as ItemOut | undefined;
    if (item && e.over?.id === "doll" && !slotOf(wearing, item.id)) toggle(item);
  };

  if (items.isLoading || avatar.isLoading) return <RoomSkeleton />;
  if (items.isError) return <ErrorNote className="m-4">Couldn&apos;t load your wardrobe. {errorMessage(items.error)}</ErrorNote>;
  if (!items.data?.length) {
    return (
      <div className="px-4 pt-6 sm:px-0">
        <EmptyState
          icon={<Shirt />}
          title="Nothing to try on yet"
          description="Add clothes to your wardrobe, then come back to dress your doll."
          action={
            <Button asChild>
              <Link href="/wardrobe">Go to wardrobe</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const toolbar = (
    <div className="flex items-center gap-1.5">
      <Tip label="Undo">
        <Button variant="secondary" size="icon-sm" aria-label="Undo" disabled={!history.length} onClick={undo}>
          <Undo2 />
        </Button>
      </Tip>
      <Tip label="Take everything off">
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Take everything off"
          disabled={!selection.length}
          onClick={() => update({})}
        >
          <Eraser />
        </Button>
      </Tip>
      <Button variant="accent" size="sm" disabled={!selection.length} onClick={() => setSaveOpen(true)}>
        <Save />
        Save
      </Button>
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="flex flex-col gap-0 lg:grid lg:h-[calc(100dvh-4.5rem)] lg:grid-cols-[76px_minmax(260px,320px)_1fr_250px] lg:gap-4">
        {/* category rail (desktop) */}
        <nav aria-label="Categories" className="hidden flex-col items-center gap-1.5 overflow-y-auto py-1 lg:flex">
          {RAIL.map((r) => (
            <RailButton key={r.key} r={r} active={rail === r.key} count={counts[r.key] ?? 0} onClick={() => setRail(r.key)} />
          ))}
        </nav>

        {/* stage — first on mobile */}
        <section className="order-first lg:order-none lg:col-start-3 lg:row-start-1 lg:min-h-0">
          <Stage
            svg={stageSvg}
            zoom={zoom}
            dropActive={!!dragging}
            updating={updating}
            className="h-[min(58dvh,560px)] rounded-none sm:rounded-[28px] lg:h-full"
          >
            <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2">
              <div className="hidden sm:block">
                <p className="font-display text-2xl leading-none">Creation Room</p>
                {remix.data?.name && remixId && <p className="mt-1 text-xs text-muted">Remixing {remix.data.name}</p>}
              </div>
              <div className="ml-auto">{toolbar}</div>
            </div>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 sm:flex-row">
              <HairSwatches current={avatar.data?.features.hair_color as string | undefined} />
              <ZoomControl zoom={zoom} onChange={setZoom} />
            </div>
            {problems.length > 0 && (
              <div className="absolute top-14 right-3 left-3 sm:right-auto sm:max-w-xs">
                {problems.map((p) => (
                  <p
                    key={p}
                    className="mb-1.5 flex items-start gap-2 rounded-xl bg-warn-soft px-3 py-2 text-[13px] text-warn"
                  >
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {p}
                  </p>
                ))}
              </div>
            )}
          </Stage>
          <div className="py-3 lg:hidden">
            <WearingStrip wearing={wearing} byId={byId} onRemove={removeSlot} />
          </div>
        </section>

        {/* item panel */}
        <section
          aria-label="Your wardrobe"
          className="flex min-h-0 flex-col border-t border-line bg-bg lg:col-start-2 lg:row-start-1 lg:rounded-[28px] lg:border lg:bg-surface"
        >
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-4 pt-3 lg:hidden">
            {RAIL.filter((r) => r.key === "all" || (counts[r.key] ?? 0) > 0).map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRail(r.key)}
                aria-pressed={rail === r.key}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition",
                  rail === r.key ? "border-ink bg-ink text-bg" : "border-line bg-surface",
                )}
              >
                <r.icon className="size-4" />
                {r.label}
              </button>
            ))}
          </div>
          <div className="px-4 pt-3 lg:pt-4">
            <div className="hidden items-baseline justify-between pb-3 lg:flex">
              <h2 className="text-sm font-semibold">{RAIL.find((r) => r.key === rail)?.label}</h2>
              <span className="text-xs text-muted">{visible.length}</span>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <span className="sr-only">Search your wardrobe</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or color"
                className="h-10 w-full rounded-full border border-line bg-bg pr-3 pl-9 text-sm outline-none placeholder:text-faint focus:border-ink lg:bg-surface-2/60"
              />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {visible.length ? (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3">
                {visible.map((item) => (
                  <ItemTile key={item.id} item={item} worn={!!slotOf(wearing, item.id)} onToggle={() => toggle(item)} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted">Nothing here.</p>
            )}
          </div>
        </section>

        {/* wearing (desktop) */}
        <aside aria-label="Wearing" className="hidden min-h-0 flex-col lg:flex">
          <div className="flex items-baseline justify-between px-1 pt-1 pb-3">
            <h2 className="text-sm font-semibold">Wearing</h2>
            <span className="text-xs text-muted">{selection.length} of 10</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <WearingList wearing={wearing} byId={byId} onRemove={removeSlot} />
          </div>
        </aside>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="size-24 rotate-3 overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-line">
            <GarmentImage item={dragging} alt="" className="p-1.5" />
          </div>
        )}
      </DragOverlay>

      <SaveDialog
        key={saveOpen ? "open" : "closed"}
        open={saveOpen}
        onOpenChange={setSaveOpen}
        items={selection}
        themes={options.data?.themes ?? []}
        defaultName={remixId && remix.data?.name ? `${remix.data.name} remix` : ""}
      />
    </DndContext>
  );
}

function Stage({
  svg,
  zoom,
  dropActive,
  updating,
  className,
  children,
}: {
  svg?: string | null;
  zoom: Zoom;
  dropActive: boolean;
  updating: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "doll" });
  return (
    <div ref={setNodeRef} className="relative h-full">
      <DollStage svg={svg} alt="Your doll" size="hero" zoom={zoom} live className={cn("h-full", className)}>
        {children}
        {updating && (
          <span className="absolute top-14 right-4 flex items-center gap-1.5 text-xs text-muted sm:top-16" aria-live="polite">
            <Spinner className="size-3.5" />
            Updating
          </span>
        )}
      </DollStage>
      {dropActive && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-2 rounded-[24px] border-2 border-dashed transition",
            isOver ? "border-accent bg-accent/5" : "border-ink/20",
          )}
        />
      )}
    </div>
  );
}

function RailButton({
  r,
  active,
  count,
  onClick,
}: {
  r: (typeof RAIL)[number];
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${r.label} (${count})`}
      className={cn("group flex w-full flex-col items-center gap-1 py-1", count === 0 && r.key !== "all" && "opacity-40")}
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-full transition",
          active ? "bg-ink text-bg shadow-md" : "bg-surface text-ink ring-1 ring-line group-hover:ring-ink/40",
        )}
      >
        <r.icon className="size-5" />
      </span>
      <span className={cn("text-[10.5px]", active ? "font-medium text-ink" : "text-muted")}>{r.label}</span>
    </button>
  );
}

function RoomSkeleton() {
  return (
    <div className="grid gap-4 p-4 lg:h-[calc(100dvh-4.5rem)] lg:grid-cols-[76px_320px_1fr_250px] lg:p-0">
      <Skeleton className="hidden lg:block" />
      <Skeleton className="h-64 lg:h-auto" />
      <Skeleton className="h-[58dvh] rounded-[28px] lg:h-auto" />
      <Skeleton className="hidden lg:block" />
    </div>
  );
}
