"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddItemDialog } from "@/components/wardrobe/add-item-dialog";
import { CATEGORY_LABEL, CategoryGlyph } from "@/components/wardrobe/category";
import { CollectionDialog } from "@/components/wardrobe/collection-dialog";
import { ItemDrawer, ItemTile } from "@/components/wardrobe/item-drawer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Chip, EmptyState, ErrorNote, Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { Category, ItemOut } from "@/lib/api/types";
import { useCollections, useInvalidateWardrobe, useItems } from "@/lib/queries/wardrobe";
import { plural } from "@/lib/utils";

export default function CollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const router = useRouter();
  const collections = useCollections();
  const collection = collections.data?.find((c) => c.id === collectionId);

  const [category, setCategory] = useState<Category | "">("");
  const [colorInput, setColorInput] = useState("");
  const [color, setColor] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setColor(colorInput), 300);
    return () => clearTimeout(t);
  }, [colorInput]);

  const all = useItems({ collection_id: collectionId });
  const filtered = useItems({ collection_id: collectionId, category, color });
  const items = filtered.data ?? [];
  const categoriesHere = useMemo(
    () => Array.from(new Set((all.data ?? []).map((i) => i.category))),
    [all.data],
  );

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  if (collections.isSuccess && !collection) {
    return (
      <EmptyState
        title="Collection not found"
        description="It may have been deleted."
        action={
          <Button asChild variant="secondary">
            <Link href="/wardrobe">Back to wardrobe</Link>
          </Button>
        }
      />
    );
  }

  const filtering = !!category || !!color;

  return (
    <>
      <Link href="/wardrobe" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" />
        Wardrobe
      </Link>

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {collection ? (
            <>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-[0.14em] text-muted uppercase">
                <CategoryGlyph category={collection.category} className="size-4" />
                {CATEGORY_LABEL[collection.category]}
              </p>
              <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl">{collection.name}</h1>
              <p className="mt-3 text-[15px] text-muted">{plural(collection.item_count, "piece")}</p>
            </>
          ) : (
            <>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-11 w-64" />
            </>
          )}
        </div>
        {collection && (
          <div className="flex gap-2">
            <Button onClick={() => setAdding(true)}>
              <Plus />
              Add item
            </Button>
            <Menu>
              <MenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Collection options">
                  <MoreHorizontal />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem onSelect={() => setEditing(true)}>
                  <Pencil />
                  Rename or change type
                </MenuItem>
                <MenuItem danger onSelect={() => setDeleting(true)}>
                  <Trash2 />
                  Delete collection
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        )}
      </header>

      {(all.data?.length ?? 0) > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="Filter by color"
              aria-label="Filter by color"
              className="h-10 pl-10"
            />
          </div>
          {categoriesHere.length > 1 && (
            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <Chip selected={!category} onClick={() => setCategory("")}>
                All
              </Chip>
              {categoriesHere.map((c) => (
                <Chip key={c} selected={category === c} onClick={() => setCategory(category === c ? "" : c)}>
                  <CategoryGlyph category={c} />
                  {CATEGORY_LABEL[c]}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.isError && <ErrorNote>{errorMessage(filtered.error)}</ErrorNote>}

      {filtered.isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="mt-2.5 h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        filtering ? (
          <EmptyState
            title="Nothing matches"
            description="Try another color or category."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setCategory("");
                  setColorInput("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={collection ? <CategoryGlyph category={collection.category} /> : undefined}
            title="No pieces yet"
            description="Add a photo and we'll fill in the name and color for you."
            action={
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Add the first piece
              </Button>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <ItemTile key={item.id} item={item} onOpen={() => setOpenItem(item)} />
          ))}
        </div>
      )}

      {collection && (
        <>
          <AddItemDialog open={adding} onOpenChange={setAdding} collection={collection} />
          <CollectionDialog open={editing} onOpenChange={setEditing} collection={collection} />
          <DeleteCollectionDialog
            open={deleting}
            onOpenChange={setDeleting}
            id={collection.id}
            name={collection.name}
            count={collection.item_count}
            onDeleted={() => router.replace("/wardrobe")}
          />
        </>
      )}
      <ItemDrawer item={openItem} collections={collections.data ?? []} onClose={() => setOpenItem(null)} />
    </>
  );
}

function DeleteCollectionDialog({
  open,
  onOpenChange,
  id,
  name,
  count,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  id: string;
  name: string;
  count: number;
  onDeleted: () => void;
}) {
  const invalidate = useInvalidateWardrobe();
  const [needsCascade, setNeedsCascade] = useState(false);
  useEffect(() => {
    if (open) setNeedsCascade(false);
  }, [open]);

  const remove = useMutation({
    mutationFn: (cascade: boolean) => api(`/collections/${id}`, { method: "DELETE", query: { cascade: cascade || undefined } }),
    onSuccess: () => {
      invalidate();
      toast.success(`${name} deleted`);
      onOpenChange(false);
      onDeleted();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) setNeedsCascade(true);
      else toast.error(errorMessage(e));
    },
  });

  const hasItems = needsCascade || count > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Delete ${name}?`}>
        <p className="text-[15px] text-muted">
          {hasItems
            ? `It still has ${plural(count, "piece")}. Deleting the collection deletes them too, and outfits that use them will show them as missing.`
            : "This can't be undone."}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(hasItems)}>
            {hasItems ? `Delete collection and ${plural(count, "piece")}` : "Delete collection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
