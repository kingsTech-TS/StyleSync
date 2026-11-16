"use client";

import { Plus } from "lucide-react";
import { GarmentImage } from "@/components/wardrobe/garment-image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_LABEL, CategoryGlyph } from "@/components/wardrobe/category";
import { CollectionDialog, PresetCollections } from "@/components/wardrobe/collection-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNote, PageHeader } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/api/errors";
import type { CollectionOut, ItemOut } from "@/lib/api/types";
import { useCollections, useItems } from "@/lib/queries/wardrobe";
import { plural } from "@/lib/utils";

export default function WardrobePage() {
  const collections = useCollections();
  const items = useItems();
  const [creating, setCreating] = useState(false);

  const byCollection = useMemo(() => {
    const map = new Map<string, ItemOut[]>();
    for (const item of items.data ?? []) {
      const list = map.get(item.collection_id) ?? [];
      list.push(item);
      map.set(item.collection_id, list);
    }
    return map;
  }, [items.data]);

  const list = collections.data ?? [];
  const total = items.data?.length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Wardrobe"
        title="Everything you own"
        description={
          list.length
            ? `${plural(total, "piece")} across ${plural(list.length, "collection")}. The stylist only ever picks from these.`
            : "Sort your clothes into collections. The stylist only ever picks from what's here."
        }
        actions={
          list.length > 0 && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              New collection
            </Button>
          )
        }
      />

      {collections.isError && <ErrorNote>{errorMessage(collections.error)}</ErrorNote>}

      {collections.isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/5] rounded-[var(--radius-card)]" />
              <Skeleton className="mt-3 h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<CategoryGlyph category="top" />}
          title="Start with a few collections"
          description="Tap the ones you need. You can rename them or add your own later."
          action={
            <div className="flex flex-col items-center gap-4">
              <PresetCollections existing={list} />
              <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
                Make a custom one
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => (
            <CollectionCard key={c.id} collection={c} items={byCollection.get(c.id) ?? []} />
          ))}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line text-sm text-muted transition hover:border-ink/40 hover:text-ink"
          >
            <Plus className="size-5" />
            New collection
          </button>
        </div>
      )}

      <CollectionDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function CollectionCard({ collection, items }: { collection: CollectionOut; items: ItemOut[] }) {
  const preview = items.slice(0, 4);
  return (
    <Link href={`/wardrobe/${collection.id}`} className="group block">
      <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-surface-2 transition group-hover:shadow-md">
        {preview.length === 0 ? (
          <div className="grid h-full place-items-center text-faint">
            <CategoryGlyph category={collection.category} className="size-12" />
          </div>
        ) : (
          <div className={preview.length === 1 ? "h-full" : "grid h-full grid-cols-2 grid-rows-2 gap-px bg-line"}>
            {preview.map((item, i) => (
              <div
                key={item.id}
                className={
                  preview.length === 3 && i === 0 ? "row-span-2 bg-surface-2" : "bg-surface-2"
                }
              >
                <GarmentImage item={item} alt="" className="p-2 transition duration-300 group-hover:scale-[1.03]" />
              </div>
            ))}
            {preview.length === 2 && <div className="col-span-2 bg-surface-2" />}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <p className="truncate font-medium">{collection.name}</p>
          <p className="text-[13px] text-muted">{plural(collection.item_count, "piece")}</p>
        </div>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <CategoryGlyph category={collection.category} className="size-4" />
          <span className="sr-only sm:not-sr-only">{CATEGORY_LABEL[collection.category]}</span>
        </span>
      </div>
    </Link>
  );
}
