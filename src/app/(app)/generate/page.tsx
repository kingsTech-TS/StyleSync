"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Shirt, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DollStage } from "@/components/doll/doll-stage";
import { OutfitResult } from "@/components/generate/outfit-result";
import { DayNightToggle, ThemePicker, WeatherPicker } from "@/components/generate/selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorNote, PageHeader } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { useGeolocation } from "@/hooks/use-geolocation";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { GenerateIn, ItemOut, OutfitOut, UserOut, WeatherOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "@/lib/queries/keys";
import { useAvatar, useMe, useOptions, useOutfit, useQuota } from "@/lib/queries/shared";
import { cn } from "@/lib/utils";

const FALLBACK_WEATHER = ["hot", "warm", "mild", "cool", "cold", "rainy", "snowy", "windy"];

function localTimeOfDay() {
  const h = new Date().getHours();
  return h >= 6 && h < 19 ? "day" : "night";
}

export default function GeneratePage() {
  const qc = useQueryClient();
  const { setUser } = useAuth();
  const options = useOptions();
  const me = useMe();
  const quota = useQuota();
  const avatar = useAvatar();
  const items = useQuery({ queryKey: qk.items({}), queryFn: () => api<ItemOut[]>("/items") });

  const [theme, setTheme] = useState<string | null>(null);
  const [weather, setWeather] = useState("mild");
  const [temp, setTemp] = useState("");
  const [timeOfDay, setTimeOfDay] = useState(localTimeOfDay);
  const [auto, setAuto] = useState<{ city: string | null; temp: number | null } | null>(null);
  const touched = useRef(false);

  // ---- weather auto-detect: browser location → saved location → IP (server side) ----
  const autoDetect = me.data?.weather_auto_detect ?? false;
  const geo = useGeolocation(autoDetect);
  const geoSettled = geo.status !== "idle" && geo.status !== "pending";
  const coords = geo.status === "granted" ? { lat: geo.lat, lon: geo.lon } : null;
  const detected = useQuery({
    queryKey: qk.weather(coords?.lat, coords?.lon),
    queryFn: () => api<WeatherOut>("/weather/current", { query: coords ?? {} }),
    enabled: autoDetect && geoSettled,
    staleTime: 15 * 60_000,
  });

  useEffect(() => {
    const d = detected.data;
    if (!d || touched.current) return;
    setWeather(d.weather);
    setTimeOfDay(d.time_of_day);
    setTemp(d.temperature_c != null ? String(Math.round(d.temperature_c)) : "");
    setAuto(d.auto_detected ? { city: d.city, temp: d.temperature_c } : null);
  }, [detected.data]);

  useEffect(() => {
    if (!theme && options.data?.themes.length) setTheme(options.data.themes[0].slug);
  }, [options.data, theme]);

  function edit<T>(setter: (v: T) => void) {
    return (v: T) => {
      touched.current = true;
      setAuto(null);
      setter(v);
    };
  }

  const saveLocation = useMutation({
    mutationFn: () =>
      api<UserOut>("/users/me/location", {
        method: "PUT",
        body: { lat: coords!.lat, lon: coords!.lon, city: detected.data?.city ?? null, source: "browser" },
      }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Location saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  // ---- generate ----
  const [resultId, setResultId] = useState<string | null>(null);
  const [unsaved, setUnsaved] = useState<OutfitOut | null>(null);
  const saved = useOutfit(resultId);
  const result = resultId ? saved.data : unsaved;
  const resultRef = useRef<HTMLDivElement>(null);

  const generate = useMutation({
    mutationFn: (body: GenerateIn) => api<OutfitOut>("/outfits/generate", { body }),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: qk.quota });
      if (o.id) {
        qc.setQueryData(qk.outfit(o.id), o);
        qc.invalidateQueries({ queryKey: ["outfits"] });
        setResultId(o.id);
        setUnsaved(null);
      } else {
        setResultId(null);
        setUnsaved(o);
      }
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },
    onError: () => qc.invalidateQueries({ queryKey: qk.quota }),
  });

  const remaining = quota.data?.quotas.generate?.remaining;
  const offline = quota.data?.mode === "offline";
  const outOfQuota = remaining === 0;
  const tempNumber = temp.trim() === "" ? null : Number(temp);
  const tempInvalid = tempNumber != null && (Number.isNaN(tempNumber) || tempNumber < -60 || tempNumber > 60);
  const canGenerate = !!theme && !offline && !outOfQuota && !tempInvalid && !generate.isPending;

  function submit() {
    if (!theme) return;
    generate.mutate({ theme, weather, time_of_day: timeOfDay, temperature_c: tempNumber });
  }

  function reset() {
    setResultId(null);
    setUnsaved(null);
    generate.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (items.isLoading || options.isLoading) {
    return (
      <>
        <PageHeader title="Style me" />
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,440px)]">
          <Skeleton className="h-96" />
          <Skeleton className="aspect-[4/5]" />
        </div>
      </>
    );
  }

  if (items.data && items.data.length === 0) {
    return (
      <>
        <PageHeader title="Style me" description="Outfits built only from clothes you own." />
        <EmptyState
          icon={<Shirt />}
          title="Your wardrobe is empty"
          description="Add a few tops, bottoms and shoes first. The stylist only uses what you actually have."
          action={
            <Button asChild>
              <Link href="/wardrobe">Go to wardrobe</Link>
            </Button>
          }
        />
      </>
    );
  }

  const weatherOptions = options.data?.weather ?? FALLBACK_WEATHER;
  const timeOptions = options.data?.time_of_day ?? ["day", "night"];
  const generateError = generate.error;

  return (
    <>
      <PageHeader
        title="Style me"
        description="Pick the occasion. The stylist builds a look from your wardrobe and dresses your doll in it."
      />
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,440px)]">
        <form
          className="flex flex-col gap-9"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <section>
            <h2 className="mb-3 text-sm font-semibold">Occasion</h2>
            {options.isError ? (
              <ErrorNote>Couldn&apos;t load themes. {errorMessage(options.error)}</ErrorNote>
            ) : (
              <ThemePicker themes={options.data?.themes ?? []} value={theme} onChange={setTheme} />
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Weather</h2>
              <WeatherStatus
                auto={auto}
                detecting={autoDetect && (!geoSettled || detected.isFetching)}
                canSave={!!coords && !!auto && me.data?.location_city !== detected.data?.city}
                saving={saveLocation.isPending}
                onSave={() => saveLocation.mutate()}
              />
            </div>
            <WeatherPicker options={weatherOptions} value={weather} onChange={edit(setWeather)} />
            <div className="mt-5 flex flex-wrap items-end gap-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">Temperature</span>
                <span className="relative">
                  <Input
                    inputMode="numeric"
                    placeholder="Optional"
                    value={temp}
                    aria-invalid={tempInvalid}
                    onChange={(e) => edit(setTemp)(e.target.value.replace(/[^\d.-]/g, ""))}
                    className="w-32 pr-10"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted">
                    °C
                  </span>
                </span>
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium">Time of day</span>
                <DayNightToggle options={timeOptions} value={timeOfDay} onChange={edit(setTimeOfDay)} />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-line pt-6">
            {generateError && (
              <ErrorNote>
                {generateError instanceof ApiError && generateError.status === 429
                  ? generateError.message
                  : errorMessage(generateError)}
              </ErrorNote>
            )}
            {offline && (
              <ErrorNote>The stylist is resting until the free credit refreshes. The Creation Room still works.</ErrorNote>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" disabled={!canGenerate} loading={generate.isPending}>
                <WandSparkles />
                {generate.isPending ? "Putting it together" : "Style me"}
              </Button>
              {remaining != null && (
                <span className={cn("text-sm", outOfQuota ? "text-danger" : "text-muted")}>
                  {outOfQuota ? "No outfits left today" : `${remaining} left today`}
                </span>
              )}
            </div>
            {generate.isPending && (
              <p className="text-[13px] text-muted">This can take up to a minute while the stylist checks your wardrobe.</p>
            )}
          </div>
        </form>

        <div ref={resultRef} className="scroll-mt-20 lg:sticky lg:top-8">
          {result ? (
            <OutfitResult outfit={result} onAgain={reset} />
          ) : (
            <DollStage
              svg={avatar.data?.svg}
              url={avatar.data?.image_url}
              alt="Your doll"
              size="hero"
              live={!generate.isPending}
              dim={generate.isPending}
              className="aspect-[3/4] w-full sm:aspect-[4/5]"
            >
              <p className="absolute inset-x-0 bottom-5 text-center text-[13px] text-muted">
                {generate.isPending ? "Choosing from your wardrobe" : "Your outfit appears here"}
              </p>
            </DollStage>
          )}
        </div>
      </div>
    </>
  );
}

function WeatherStatus({
  auto,
  detecting,
  canSave,
  saving,
  onSave,
}: {
  auto: { city: string | null; temp: number | null } | null;
  detecting: boolean;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  if (detecting) return <span className="text-[13px] text-muted">Checking local weather</span>;
  if (!auto) return null;
  const parts = [auto.city, auto.temp != null ? `${Math.round(auto.temp)}°C` : null].filter(Boolean);
  return (
    <span className="flex items-center gap-3 text-[13px] text-muted">
      <span className="inline-flex items-center gap-1">
        <MapPin className="size-3.5" />
        Auto-detected{parts.length ? ` · ${parts.join(", ")}` : ""}
      </span>
      {canSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="font-medium text-ink underline underline-offset-4 disabled:opacity-50"
        >
          Save this location
        </button>
      )}
    </span>
  );
}
