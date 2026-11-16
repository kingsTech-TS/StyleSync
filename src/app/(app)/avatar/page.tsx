"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Camera, Eye, Hand, PersonStanding, Scissors } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BUILDS, EYES, FACE_SHAPES, HAIR, HAIR_STYLES, recolorLocally, SKIN } from "@/components/avatar/palettes";
import { SelfiePanel } from "@/components/avatar/selfie-panel";
import { SwatchPicker } from "@/components/avatar/swatches";
import { DollStage, ZoomControl, type Zoom } from "@/components/doll/doll-stage";
import { Button } from "@/components/ui/button";
import { Chip, ErrorNote } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { AvatarEditIn, AvatarOut, UserOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "@/lib/queries/keys";
import { useAvatar, useQuota } from "@/lib/queries/shared";
import { cn, titleCase } from "@/lib/utils";

type Panel = "selfie" | "hair" | "skin" | "eyes" | "shape";
type ColorKey = "hair_color" | "skin_tone" | "eye_color";

const PANELS: { id: Panel; label: string; icon: typeof Camera; zoom: Zoom }[] = [
  { id: "selfie", label: "Selfie", icon: Camera, zoom: "full" },
  { id: "hair", label: "Hair", icon: Scissors, zoom: "upper" },
  { id: "skin", label: "Skin", icon: Hand, zoom: "full" },
  { id: "eyes", label: "Eyes", icon: Eye, zoom: "face" },
  { id: "shape", label: "Face & build", icon: PersonStanding, zoom: "full" },
];

export default function AvatarPage() {
  return (
    <Suspense>
      <AvatarRoom />
    </Suspense>
  );
}

function AvatarRoom() {
  const onboarding = useSearchParams().get("onboarding") === "1";
  const avatar = useAvatar();
  const qc = useQueryClient();
  const { setUser } = useAuth();
  const [panel, setPanel] = useState<Panel>(onboarding ? "selfie" : "hair");
  const [zoom, setZoom] = useState<Zoom>(onboarding ? "full" : "upper");

  // ---- colors: instant local recolor, debounced save ----
  const pending = useRef<AvatarEditIn>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshUser = useCallback(() => {
    api<UserOut>("/users/me")
      .then(setUser)
      .catch(() => {});
  }, [setUser]);

  const saveColors = useMutation({
    mutationFn: (body: AvatarEditIn) => api<AvatarOut>("/avatar", { method: "PATCH", body }),
    onSuccess: (a) => {
      // Only accept the server copy if no newer edit is waiting.
      if (!Object.keys(pending.current).length) qc.setQueryData(qk.avatar, a);
      refreshUser();
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      qc.invalidateQueries({ queryKey: qk.avatar });
    },
  });

  const setColor = (key: ColorKey, hex: string) => {
    qc.setQueryData<AvatarOut>(qk.avatar, (a) =>
      a ? { ...a, svg: a.svg ? recolorLocally(a.svg, key, hex) : a.svg, features: { ...a.features, [key]: hex } } : a,
    );
    pending.current = { ...pending.current, [key]: hex };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const body = pending.current;
      pending.current = {};
      saveColors.mutate(body);
    }, 300);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const data = avatar.data;
  const features = (data?.features ?? {}) as Record<string, string>;
  const isPending = data?.status === "pending";

  function openPanel(p: Panel) {
    setPanel(p);
    setZoom(PANELS.find((x) => x.id === p)!.zoom);
  }

  return (
    <div className="flex flex-col gap-6">
      {onboarding && (
        <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl tracking-tight">Make the doll yours</p>
            <p className="mt-1 text-sm text-muted">
              Take a selfie and we&apos;ll draw your doll from it, or just pick colors by hand. Every outfit appears on this doll.
            </p>
          </div>
          <Button asChild variant="secondary" className="self-start sm:self-auto">
            <Link href="/wardrobe">
              Continue to wardrobe
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        {/* stage */}
        <div className="relative lg:sticky lg:top-6">
          {avatar.isPending ? (
            <Skeleton className="h-[58dvh] rounded-[28px] lg:h-[calc(100dvh-7rem)]" />
          ) : (
            <DollStage
              svg={data?.svg}
              url={data?.image_url}
              alt="Your doll"
              size="hero"
              zoom={zoom}
              live={!isPending}
              dim={isPending}
              className="h-[58dvh] min-h-[420px] lg:h-[calc(100dvh-7rem)]"
            >
              {isPending && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="flex items-center gap-2.5 rounded-full bg-surface/90 py-2 pr-4 pl-2.5 shadow-sm ring-1 ring-line backdrop-blur">
                    <span className="relative flex size-6 items-center justify-center">
                      <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />
                      <span className="size-2.5 rounded-full bg-accent" />
                    </span>
                    <span className="text-[13px] font-medium">Drawing your doll from the photo</span>
                  </div>
                </div>
              )}
              <div className="absolute right-4 bottom-4">
                <ZoomControl zoom={zoom} onChange={setZoom} />
              </div>
              <div className="absolute top-4 left-4 rounded-full bg-surface/80 px-3 py-1 text-xs text-muted ring-1 ring-line backdrop-blur">
                {data?.body_type === "male" ? "Male body" : "Female body"}
              </div>
            </DollStage>
          )}
        </div>

        {/* controls */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-4xl leading-none tracking-tight">Your doll</h1>
            <p className="mt-2 text-sm text-muted">Colors change instantly. Shape changes are redrawn for you.</p>
          </div>

          <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
            {PANELS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={panel === id}
                onClick={() => openPanel(id)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs transition",
                  panel === id ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon className="size-5" strokeWidth={1.7} />
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5" role="tabpanel">
            {data?.status === "failed" && data.error && panel === "selfie" && (
              <ErrorNote className="mb-5">Couldn&apos;t make a doll from that photo: {data.error}</ErrorNote>
            )}
            {panel === "selfie" && <SelfiePanel busy={isPending} />}
            {panel === "hair" && (
              <div className="flex flex-col gap-7">
                <SwatchPicker label="Hair color" swatches={HAIR} value={features.hair_color} onChange={(h) => setColor("hair_color", h)} size="lg" />
                <ShapePicker field="hair_style" label="Hair style" options={HAIR_STYLES} current={features.hair_style} />
              </div>
            )}
            {panel === "skin" && (
              <SwatchPicker label="Skin tone" swatches={SKIN} value={features.skin_tone} onChange={(h) => setColor("skin_tone", h)} size="lg" />
            )}
            {panel === "eyes" && (
              <SwatchPicker label="Eye color" swatches={EYES} value={features.eye_color} onChange={(h) => setColor("eye_color", h)} size="lg" />
            )}
            {panel === "shape" && (
              <div className="flex flex-col gap-7">
                <ShapePicker field="face_shape" label="Face shape" options={FACE_SHAPES} current={features.face_shape} />
                <ShapePicker field="build" label="Build" options={BUILDS} current={features.build} />
              </div>
            )}
          </div>
          <p className="px-1 text-xs text-muted">
            Outfits you made before a change keep their old look until you re-render them from the outfit page.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Hair style / face shape / build. These go through an AI redraw, so they need an explicit Apply. */
function ShapePicker({
  field,
  label,
  options,
  current,
}: {
  field: "hair_style" | "face_shape" | "build";
  label: string;
  options: string[];
  current: string | undefined;
}) {
  const qc = useQueryClient();
  const { setUser } = useAuth();
  const { data: quota } = useQuota();
  const [choice, setChoice] = useState(current ?? "");
  useEffect(() => setChoice(current ?? ""), [current]);

  const apply = useMutation({
    mutationFn: () => api<AvatarOut>("/avatar", { method: "PATCH", body: { [field]: choice } }),
    onSuccess: (a) => {
      qc.setQueryData(qk.avatar, a);
      qc.invalidateQueries({ queryKey: qk.quota });
      api<UserOut>("/users/me").then(setUser).catch(() => {});
      toast.success(`${label} updated`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const renders = quota?.quotas.render;
  const offline = quota?.mode === "offline";
  const all = Array.from(new Set([...(current ? [current] : []), ...options]));
  const changed = !!choice && choice !== current;

  return (
    <fieldset>
      <legend className="mb-3 text-[13px] font-medium">
        {label}
        {current && <span className="ml-2 font-normal text-muted">{titleCase(current)}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {all.map((o) => (
          <Chip key={o} selected={choice === o} onClick={() => setChoice(o)}>
            {titleCase(o)}
          </Chip>
        ))}
      </div>
      {changed && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" loading={apply.isPending} disabled={offline || renders?.remaining === 0} onClick={() => apply.mutate()}>
            Apply {titleCase(choice).toLowerCase()}
          </Button>
          <span className="text-xs text-muted">
            {offline
              ? "Redraws are paused right now."
              : renders
                ? `Uses a doll redraw. ${renders.remaining} left today.`
                : "Uses a doll redraw."}
          </span>
        </div>
      )}
    </fieldset>
  );
}
