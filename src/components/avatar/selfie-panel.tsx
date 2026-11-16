"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ImageUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { AvatarOut } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";
import { useQuota } from "@/lib/queries/shared";

export function SelfiePanel({ busy }: { busy: boolean }) {
  const qc = useQueryClient();
  const { data: quota } = useQuota();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [keep, setKeep] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const submit = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("selfie", file!);
      form.append("consent", String(consent));
      form.append("keep_selfie", String(keep));
      return api<AvatarOut>("/avatar", { method: "POST", form });
    },
    onSuccess: (a) => {
      qc.setQueryData(qk.avatar, a);
      qc.invalidateQueries({ queryKey: qk.quota });
      setFile(null);
      setPreview(null);
      toast.success("Got it. Your doll is being drawn.");
    },
  });

  function choose(f: File | undefined) {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Photos must be 10 MB or smaller.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const left = quota?.quotas.avatar;
  const offline = quota?.mode === "offline";
  const out = left?.remaining === 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-medium">Make the doll from a selfie</p>
        <p className="mt-1 text-sm text-muted">
          Face the camera in good light with your hair visible. We match skin tone, hair and eye color, and face shape.
        </p>
      </div>

      {submit.isError && <ErrorNote>{errorMessage(submit.error)}</ErrorNote>}

      {preview ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Your selfie" className="size-24 rounded-2xl object-cover" />
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            Choose another
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => cameraRef.current?.click()} disabled={busy}>
            <Camera />
            Take a selfie
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            <ImageUp />
            Upload a photo
          </Button>
        </div>
      )}
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
      <input ref={fileRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />

      <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 accent-[var(--ink)]" />
          <span>
            I agree that my photo is used only to draw my doll. It is never shown to anyone, and it is deleted
            afterwards unless I choose to keep it.
          </span>
        </label>
        <label className="flex items-start gap-3 text-muted">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="mt-0.5 size-4 accent-[var(--ink)]" />
          <span>Keep the photo so I can redraw my doll later</span>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          disabled={!file || !consent || busy || out || offline}
          loading={submit.isPending}
          onClick={() => submit.mutate()}
        >
          {busy ? "Drawing your doll" : "Make my doll"}
        </Button>
        <p className="text-center text-xs text-muted">
          {offline
            ? "Selfie dolls are paused right now. You can still set colors by hand."
            : left
              ? out
                ? "You've used this week's selfie dolls. Colors can still be changed by hand."
                : `${left.remaining} of ${left.limit} selfie dolls left this week`
              : null}
        </p>
      </div>
    </div>
  );
}
