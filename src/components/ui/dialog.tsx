"use client";

import { X } from "lucide-react";
import { Dialog as D } from "radix-ui";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

interface ContentProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** "center" for a modal, "right" or "bottom" for a sheet. */
  side?: "center" | "right" | "bottom";
  hideTitle?: boolean;
}

export function DialogContent({ title, description, children, className, side = "center", hideTitle }: ContentProps) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in" />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col bg-surface text-ink shadow-2xl outline-none",
          side === "center" &&
            "top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl",
          side === "right" && "inset-y-0 right-0 w-full max-w-md sm:rounded-l-3xl",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl",
          className,
        )}
      >
        <div className={cn("flex items-start justify-between gap-4 px-6 pt-6 pb-2", hideTitle && "sr-only")}>
          <div className="min-w-0">
            <D.Title className="text-lg font-semibold tracking-tight">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</D.Description>
            )}
          </div>
          <D.Close className="-mt-1 -mr-2 rounded-full p-2 text-muted transition hover:bg-surface-2 hover:text-ink">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
