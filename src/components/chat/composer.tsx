"use client";

import { ArrowUp, ImagePlus, Square, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const MAX_IMAGES = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
export const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

/** Keeps the files the backend accepts and says why the others were dropped. */
export function acceptFiles(current: File[], incoming: File[]): File[] {
  const next = [...current];
  for (const f of incoming) {
    const heic = /\.hei[cf]$/i.test(f.name);
    if (!TYPES.has(f.type) && !heic) {
      toast.error(`${f.name} isn't a JPEG, PNG, WebP or HEIC photo`);
      continue;
    }
    if (f.size > MAX_BYTES) {
      toast.error(`${f.name} is over 10 MB`);
      continue;
    }
    if (next.length >= MAX_IMAGES) {
      toast.error(`You can attach up to ${MAX_IMAGES} photos`);
      break;
    }
    next.push(f);
  }
  return next;
}

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  disabledReason: string | null;
  remaining: number | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function Composer({
  value,
  onChange,
  files,
  onFilesChange,
  onSend,
  onStop,
  busy,
  disabledReason,
  remaining,
  textareaRef,
  fileInputRef,
}: ComposerProps) {
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  // Grow with the text, up to a limit.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value, textareaRef]);

  const blocked = !!disabledReason;
  const canSend = !busy && !blocked && (value.trim().length > 0 || files.length > 0);

  return (
    <div className="px-3 pt-2 pb-3 sm:px-6 sm:pb-5">
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) onSend();
          }}
          className={cn(
            "rounded-[26px] border border-line bg-surface p-2 shadow-sm transition focus-within:border-ink/40",
            blocked && "opacity-70",
          )}
        >
          {previews.length > 0 && (
            <div className="flex gap-2 px-1.5 pt-1.5 pb-2">
              {previews.map((p, i) => (
                <div key={p.url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Attachment ${i + 1}`} className="size-16 rounded-xl object-cover ring-1 ring-line" />
                  <button
                    type="button"
                    aria-label={`Remove attachment ${i + 1}`}
                    onClick={() => onFilesChange(files.filter((f) => f !== p.file))}
                    className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink text-bg shadow"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={(e) => {
                onFilesChange(acceptFiles(files, Array.from(e.target.files ?? [])));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              aria-label="Attach photos"
              disabled={blocked || files.length >= MAX_IMAGES}
              onClick={() => fileInputRef.current?.click()}
              className="grid size-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-40"
            >
              <ImagePlus className="size-5" />
            </button>
            <label htmlFor="chat-input" className="sr-only">
              Message the stylist
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              rows={1}
              value={value}
              maxLength={2000}
              disabled={blocked}
              placeholder={blocked ? "The stylist is unavailable" : "Ask for an outfit or a tip"}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (canSend) onSend();
                }
              }}
              onPaste={(e) => {
                const pasted = Array.from(e.clipboardData.files);
                if (pasted.length) {
                  e.preventDefault();
                  onFilesChange(acceptFiles(files, pasted));
                }
              }}
              className="max-h-[200px] min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
            />
            {busy ? (
              <button
                type="button"
                aria-label="Stop"
                onClick={onStop}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bg transition hover:bg-ink/85"
              >
                <Square className="size-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send"
                disabled={!canSend}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bg transition hover:bg-ink/85 disabled:bg-surface-3 disabled:text-faint"
              >
                <ArrowUp className="size-[18px]" />
              </button>
            )}
          </div>
        </form>
        <p className="mt-2 px-4 text-center text-xs text-muted">
          {disabledReason ??
            (remaining !== null
              ? `${remaining} ${remaining === 1 ? "message" : "messages"} left today · Outfits only use clothes you own`
              : "Outfits only use clothes you own")}
        </p>
      </div>
    </div>
  );
}
