"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ImageUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ErrorNote } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { AnalyzeOut, CollectionOut, ItemOut } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";
import { useQuota } from "@/lib/queries/shared";
import { useInvalidateWardrobe } from "@/lib/queries/wardrobe";
import { cn } from "@/lib/utils";
import { type DraftKey, draftFromSuggestion, draftToBody, type ItemDraft, ItemFields } from "./item-fields";

const MAX_MB = 10;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: CollectionOut;
}

export function AddItemDialog({ open, onOpenChange, collection }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeOut | null>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [aiFilled, setAiFilled] = useState<Set<DraftKey>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);

  const reset = () => {
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    setAnalysis(null);
    setDraft(null);
    setAiFilled(new Set());
    setLocalError(null);
    analyze.reset();
    save.reset();
  };

  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const qc = useQueryClient();
  const invalidate = useInvalidateWardrobe();

  const analyze = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("image", file);
      return api<AnalyzeOut>("/items/analyze", { method: "POST", form });
    },
    onSuccess: (res) => {
      const { draft: d, filled } = draftFromSuggestion(res.suggestion, collection.category);
      setAnalysis(res);
      setDraft(d);
      setAiFilled(filled);
      qc.invalidateQueries({ queryKey: qk.quota });
    },
  });

  const save = useMutation({
    mutationFn: () =>
      api<ItemOut>(`/collections/${collection.id}/items`, {
        body: { upload_id: analysis!.upload_id, ...draftToBody(draft!) },
      }),
    onSuccess: (item) => {
      invalidate();
      qc.invalidateQueries({ queryKey: qk.quota });
      toast.success(`${item.name} added to ${collection.name}`);
      onOpenChange(false);
    },
  });

  function choose(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      setLocalError("Choose a photo (JPEG, PNG, WebP or HEIC).");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setLocalError(`Photos must be ${MAX_MB} MB or smaller.`);
      return;
    }
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return URL.createObjectURL(file);
    });
    analyze.mutate(file);
  }

  const step = draft ? "details" : "photo";
  const canSave = !!draft && draft.name.trim() && draft.primary_color.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={step === "photo" ? `Add to ${collection.name}` : "Check the details"}
        description={
          step === "photo"
            ? "A flat lay or a hanger shot on a plain background works best."
            : analysis?.suggestion
              ? "Filled in from your photo. Fix anything that's off."
              : "Fill in the details."
        }
        className="max-w-2xl"
      >
        {step === "photo" ? (
          <PhotoStep
            preview={preview}
            scanning={analyze.isPending}
            error={localError ?? (analyze.isError ? errorMessage(analyze.error) : null)}
            onFile={choose}
          />
        ) : (
          <form
            className="grid gap-6 sm:grid-cols-[200px_1fr]"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSave) save.mutate();
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="aspect-square overflow-hidden rounded-2xl bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview ?? analysis?.image_url} alt="Your item" className="h-full w-full object-contain" />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                Use a different photo
              </Button>
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              {analysis?.notice && (
                <p className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">{analysis.notice}</p>
              )}
              {save.isError && <ErrorNote>{errorMessage(save.error)}</ErrorNote>}
              <ItemFields
                value={draft!}
                onChange={setDraft}
                aiFilled={aiFilled}
                onEdited={(k) =>
                  setAiFilled((s) => {
                    if (!s.has(k)) return s;
                    const next = new Set(s);
                    next.delete(k);
                    return next;
                  })
                }
              />
              <Button type="submit" size="lg" loading={save.isPending} disabled={!canSave}>
                Save to {collection.name}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PhotoStep({
  preview,
  scanning,
  error,
  onFile,
}: {
  preview: string | null;
  scanning: boolean;
  error: string | null;
  onFile: (f: File | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const { data: quota } = useQuota();
  const scans = quota?.quotas.tag;

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorNote>{error}</ErrorNote>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl border-2 border-dashed transition",
          over ? "border-ink bg-surface-2" : "border-line bg-surface-2/50",
          preview && "border-solid border-transparent",
        )}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your item" className="h-full w-full object-contain" />
            {scanning && <ScanOverlay />}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-surface text-muted shadow-sm ring-1 ring-line">
              <ImageUp className="size-6" />
            </div>
            <div>
              <p className="font-medium">Drop a photo here</p>
              <p className="mt-1 text-sm text-muted">JPEG, PNG, WebP or HEIC, up to {MAX_MB} MB</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => fileRef.current?.click()}>
                <ImageUp />
                Choose photo
              </Button>
              <Button type="button" variant="secondary" onClick={() => cameraRef.current?.click()} className="sm:hidden">
                <Camera />
                Take photo
              </Button>
            </div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {scans && (
        <p className="text-center text-xs text-muted">
          {scans.remaining > 0
            ? `${scans.remaining} photo ${scans.remaining === 1 ? "scan" : "scans"} left today. After that you fill in the details yourself.`
            : "No photo scans left today. You can still add the item and fill in the details."}
        </p>
      )}
    </div>
  );
}

function ScanOverlay() {
  return (
    <div className="absolute inset-0 bg-ink/25">
      <style>{`@keyframes ss-scan{0%{top:0}100%{top:100%}}`}</style>
      <div
        className="absolute inset-x-0 h-16 -translate-y-1/2 bg-gradient-to-b from-transparent via-white/45 to-transparent"
        style={{ animation: "ss-scan 1.6s ease-in-out infinite alternate" }}
      />
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <span className="rounded-full bg-surface/90 px-4 py-2 text-[13px] font-medium shadow-sm backdrop-blur">
          Reading the item
        </span>
      </div>
    </div>
  );
}
