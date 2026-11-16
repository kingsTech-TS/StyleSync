"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { OutfitOut, RenderInfo } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";
import { cn } from "@/lib/utils";
import { DollStage, type Zoom } from "./doll-stage";

interface OutfitRenderProps {
  outfit: Pick<OutfitOut, "id" | "render" | "name">;
  size?: "hero" | "card" | "thumb";
  zoom?: Zoom;
  live?: boolean;
  /** Owners can re-render a failed render. */
  canRerender?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** An outfit on its doll, with the render's pending / failed states. */
export function OutfitRender({ outfit, size = "card", zoom, live, canRerender, className, children }: OutfitRenderProps) {
  const { render } = outfit;
  const pending = render.status === "pending";
  const failed = render.status === "failed";
  return (
    <DollStage
      svg={render.svg}
      url={render.image_url}
      alt={outfit.name ? `${outfit.name} on the doll` : "Outfit on the doll"}
      size={size}
      zoom={zoom}
      live={live && !pending}
      dim={pending && !!(render.svg || render.image_url)}
      className={className}
    >
      {pending && <RenderPending size={size} />}
      {failed && (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-2xl bg-surface/90 p-2.5 pl-3.5 text-[13px] shadow-sm ring-1 ring-line backdrop-blur">
          <span className="text-danger">Render failed</span>
          {canRerender && outfit.id && <RerenderButton outfitId={outfit.id} />}
        </div>
      )}
      {!pending && render.method === "layered" && size !== "thumb" && (
        <span className="absolute top-3 left-3 rounded-full bg-surface/85 px-2.5 py-1 text-[11px] font-medium text-muted ring-1 ring-line backdrop-blur">
          Quick preview
        </span>
      )}
      {children}
    </DollStage>
  );
}

function RenderPending({ size }: { size: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-full bg-surface/90 py-2 pr-4 pl-2.5 shadow-sm ring-1 ring-line backdrop-blur",
          size === "thumb" && "scale-75",
        )}
      >
        <span className="relative flex size-6 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />
          <span className="size-2.5 rounded-full bg-accent" />
        </span>
        <span className="text-[13px] font-medium">Dressing your doll</span>
      </div>
    </div>
  );
}

export function RerenderButton({ outfitId, label = "Try again" }: { outfitId: string; label?: string }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => api<RenderInfo>(`/outfits/${outfitId}/render`, { method: "POST" }),
    onSuccess: (render) => {
      qc.setQueryData<OutfitOut>(qk.outfit(outfitId), (o) => (o ? { ...o, render } : o));
      qc.invalidateQueries({ queryKey: qk.outfit(outfitId) });
      qc.invalidateQueries({ queryKey: ["outfits"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Button size="sm" variant="secondary" loading={m.isPending} onClick={() => m.mutate()}>
      <RotateCw />
      {label}
    </Button>
  );
}
