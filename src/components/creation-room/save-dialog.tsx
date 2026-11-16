"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { ErrorNote } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { OptionTheme, OutfitOut, Slot } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: { item_id: string; slot: Slot }[];
  themes: OptionTheme[];
  defaultName?: string;
}

export function SaveDialog({ open, onOpenChange, items, themes, defaultName }: SaveDialogProps) {
  const qc = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState(defaultName ?? "");
  const [theme, setTheme] = useState("");
  const [saved, setSaved] = useState<OutfitOut | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api<OutfitOut>("/outfits", {
        body: { name: name.trim() || null, items, theme: theme || null },
      }),
    onSuccess: (o) => {
      qc.setQueryData(qk.outfit(o.id!), o);
      qc.invalidateQueries({ queryKey: ["outfits"] });
      qc.invalidateQueries({ queryKey: qk.quota });
      setSaved(o);
    },
  });

  const publish = useMutation({
    mutationFn: () => api<OutfitOut>(`/feed/outfits/${saved!.id}/publish`, { method: "POST" }),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: qk.outfit(o.id!) });
      qc.invalidateQueries({ queryKey: ["outfits"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Published to the feed");
      router.push(`/outfits/${o.id}`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  function change(next: boolean) {
    if (!next) {
      setSaved(null);
      save.reset();
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      {saved ? (
        <DialogContent title="Outfit saved" description="Your doll is being dressed in it now.">
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-3 rounded-2xl bg-success-soft px-4 py-3 text-sm text-success">
              <Check className="size-4" />
              {saved.name ?? "My outfit"} is in My outfits.
            </div>
            <Button variant="accent" size="lg" loading={publish.isPending} onClick={() => publish.mutate()}>
              <Globe />
              Publish to the feed
            </Button>
            <Button variant="secondary" size="lg" onClick={() => router.push(`/outfits/${saved.id}`)}>
              View outfit
            </Button>
            <Button variant="ghost" onClick={() => change(false)}>
              Keep styling
            </Button>
          </div>
        </DialogContent>
      ) : (
        <DialogContent title="Save outfit" description={`${items.length} ${items.length === 1 ? "piece" : "pieces"} on your doll.`}>
          <form
            className="flex flex-col gap-5 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {save.error && <ErrorNote>{errorMessage(save.error)}</ErrorNote>}
            <Field label="Name">
              {(id) => (
                <Input
                  id={id}
                  autoFocus
                  maxLength={80}
                  placeholder="My outfit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
            <Field label="Occasion" hint="Optional. Helps people find it in the feed.">
              {(id, d) => (
                <Select id={id} aria-describedby={d} value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="">None</option>
                  {themes.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Button type="submit" size="lg" loading={save.isPending}>
              Save outfit
            </Button>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
