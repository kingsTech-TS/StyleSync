"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { ErrorNote } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { CATEGORIES, type Category, type CollectionOut } from "@/lib/api/types";
import { useInvalidateWardrobe } from "@/lib/queries/wardrobe";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, CategoryGlyph, PRESETS } from "./category";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this collection instead of creating one. */
  collection?: CollectionOut;
  onSaved?: (c: CollectionOut) => void;
}

export function CollectionDialog({ open, onOpenChange, collection, onSaved }: Props) {
  const invalidate = useInvalidateWardrobe();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setName(collection?.name ?? "");
      setCategory(collection?.category ?? null);
      setNameTouched(!!collection);
    }
  }, [open, collection]);

  const save = useMutation({
    mutationFn: () =>
      collection
        ? api<CollectionOut>(`/collections/${collection.id}`, { method: "PATCH", body: { name: name.trim(), category } })
        : api<CollectionOut>("/collections", { body: { name: name.trim(), category } }),
    onSuccess: (c) => {
      invalidate();
      toast.success(collection ? "Collection updated" : `${c.name} created`);
      onOpenChange(false);
      onSaved?.(c);
    },
  });

  function pick(c: Category) {
    setCategory(c);
    // Fill the name from the category until the user types their own.
    if (!nameTouched) setName(PRESETS.find((p) => p.category === c)?.name ?? CATEGORY_LABEL[c]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={collection ? "Edit collection" : "New collection"}
        description={collection ? undefined : "Group clothes the way you'd sort a closet."}
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && category) save.mutate();
          }}
        >
          {save.isError && <ErrorNote>{errorMessage(save.error)}</ErrorNote>}
          <fieldset>
            <legend className="mb-2.5 text-[13px] font-medium">What goes in it</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={category === c}
                  onClick={() => pick(c)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs transition",
                    category === c ? "border-ink bg-ink text-bg" : "border-line hover:border-ink/40",
                  )}
                >
                  <CategoryGlyph category={c} className="size-6" />
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Name">
            {(id) => (
              <Input
                id={id}
                value={name}
                maxLength={40}
                placeholder="e.g. Work shirts"
                onChange={(e) => {
                  setName(e.target.value);
                  setNameTouched(true);
                }}
              />
            )}
          </Field>
          <Button type="submit" size="lg" loading={save.isPending} disabled={!name.trim() || !category}>
            {collection ? "Save changes" : "Create collection"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** One-tap starter collections for an empty wardrobe. */
export function PresetCollections({ existing }: { existing: CollectionOut[] }) {
  const invalidate = useInvalidateWardrobe();
  const [busy, setBusy] = useState<string | null>(null);
  const taken = new Set(existing.map((c) => c.name.toLowerCase()));
  const available = PRESETS.filter((p) => !taken.has(p.name.toLowerCase()));
  if (!available.length) return null;

  async function create(p: (typeof PRESETS)[number]) {
    setBusy(p.name);
    try {
      await api("/collections", { body: p });
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {available.map((p) => (
        <button
          key={p.name}
          type="button"
          disabled={busy !== null}
          onClick={() => create(p)}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface pr-3.5 pl-2.5 text-sm transition hover:border-ink/40 disabled:opacity-50"
        >
          <CategoryGlyph category={p.category} className="size-4 text-muted" />
          {busy === p.name ? "Adding…" : p.name}
        </button>
      ))}
    </div>
  );
}
