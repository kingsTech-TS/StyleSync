"use client";

import { useMutation } from "@tanstack/react-query";
import { GarmentImage } from "@/components/wardrobe/garment-image";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/input";
import { ErrorNote } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { CollectionOut, ItemOut } from "@/lib/api/types";
import { useInvalidateWardrobe } from "@/lib/queries/wardrobe";
import { cn } from "@/lib/utils";
import { draftFromItem, draftToBody, type ItemDraft, ItemFields } from "./item-fields";

export function ItemTile({ item, onOpen }: { item: ItemOut; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="group text-left">
      <div className="aspect-square overflow-hidden rounded-2xl bg-surface-2">
        <GarmentImage item={item} alt="" className="p-3 transition duration-300 group-hover:scale-[1.04]" />
      </div>
      <div className="mt-2.5 flex items-start gap-2 px-0.5">
        <span
          className="mt-[5px] size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ background: item.color_hex ?? "var(--surface-3)" }}
          aria-hidden
        />
        <span className="min-w-0">
          <span className="line-clamp-2 text-sm leading-snug font-medium">{item.name}</span>
          <span className="block truncate text-xs text-muted">{item.primary_color}</span>
        </span>
      </div>
    </button>
  );
}

interface DrawerProps {
  item: ItemOut | null;
  collections: CollectionOut[];
  onClose: () => void;
}

export function ItemDrawer({ item, collections, onClose }: DrawerProps) {
  const invalidate = useInvalidateWardrobe();
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [collectionId, setCollectionId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (item) {
      setDraft(draftFromItem(item));
      setCollectionId(item.collection_id);
      setConfirmDelete(false);
    }
  }, [item]);

  const save = useMutation({
    mutationFn: () =>
      api<ItemOut>(`/items/${item!.id}`, {
        method: "PATCH",
        body: { ...draftToBody(draft!), collection_id: collectionId !== item!.collection_id ? collectionId : undefined },
      }),
    onSuccess: (updated) => {
      invalidate();
      const moved = updated.collection_id !== item!.collection_id;
      toast.success(moved ? `Moved to ${collections.find((c) => c.id === updated.collection_id)?.name}` : "Saved");
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/items/${item!.id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast.success(`${item!.name} deleted`);
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent side="right" title={item?.name ?? "Item"} description="Edit, move or delete this piece.">
        {item && draft && (
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="aspect-square overflow-hidden rounded-3xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.name} className="h-full w-full object-contain" />
            </div>
            {save.isError && <ErrorNote>{errorMessage(save.error)}</ErrorNote>}
            <ItemFields value={draft} onChange={setDraft} />
            <Field label="Collection">
              {(id) => (
                <Select id={id} value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Button type="submit" size="lg" loading={save.isPending} disabled={!draft.name.trim() || !draft.primary_color.trim()}>
              Save changes
            </Button>
            <div className={cn("rounded-2xl border p-4", confirmDelete ? "border-danger/40 bg-danger-soft" : "border-line")}>
              {confirmDelete ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm">
                    Delete <strong>{item.name}</strong>? Outfits that use it will show it as missing.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="danger" size="sm" loading={remove.isPending} onClick={() => remove.mutate()}>
                      Delete item
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                      Keep it
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 text-sm text-danger"
                >
                  <Trash2 className="size-4" />
                  Delete this item
                </button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
