"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LocateFixed, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password";
import { Field, Input } from "@/components/ui/input";
import { ErrorNote, Switch } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { AIUsage, CommentPolicy, QuotaFeature, UserOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "@/lib/queries/keys";
import { cn } from "@/lib/utils";
import { changePasswordSchema } from "@/lib/validation/auth";

export function Section({
  title,
  description,
  id,
  children,
}: {
  title: string;
  description?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-4 border-t border-line py-8 md:grid-cols-[240px_1fr] md:gap-10">
      <div>
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function useUpdateUser() {
  const { setUser } = useAuth();
  const qc = useQueryClient();
  return (u: UserOut) => {
    setUser(u);
    qc.setQueryData(qk.me, u);
  };
}

export function NameForm({ user }: { user: UserOut }) {
  const update = useUpdateUser();
  const [name, setName] = useState(user.full_name);
  useEffect(() => setName(user.full_name), [user.full_name]);
  const save = useMutation({
    mutationFn: () => api<UserOut>("/users/me", { method: "PATCH", body: { full_name: name.trim() } }),
    onSuccess: (u) => {
      update(u);
      toast.success("Name saved");
    },
  });
  const changed = name.trim() !== user.full_name && name.trim().length >= 2;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (changed) save.mutate();
      }}
    >
      {save.isError && <ErrorNote>{errorMessage(save.error)}</ErrorNote>}
      <Field label="Full name">
        {(id) => <Input id={id} value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Username" hint="Usernames can't be changed">
          {(id, d) => <Input id={id} aria-describedby={d} value={`@${user.username}`} disabled readOnly />}
        </Field>
        <Field label="Email">
          {(id) => <Input id={id} value={user.email} disabled readOnly />}
        </Field>
      </div>
      <div>
        <Button type="submit" variant="secondary" disabled={!changed} loading={save.isPending}>
          Save name
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const form = useForm<z.infer<typeof changePasswordSchema>>({ resolver: zodResolver(changePasswordSchema) });
  const { errors, isSubmitting } = form.formState;
  const [error, setError] = useState<string | null>(null);
  const { user, login } = useAuth();

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await api("/users/me/change-password", { body: values });
      // The backend signs out every session, this one included. Sign straight back in
      // with the new password so this device gets a fresh refresh token.
      if (user) await login(user.username, values.new_password).catch(() => undefined);
      form.reset({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("Password changed");
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fields).length) {
        for (const [k, msg] of Object.entries(e.fields)) {
          form.setError(k as keyof z.infer<typeof changePasswordSchema>, { message: msg });
        }
      } else if (e instanceof ApiError && /current/i.test(e.message)) {
        form.setError("current_password", { message: e.message });
      } else {
        setError(errorMessage(e));
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Field label="Current password" error={errors.current_password?.message}>
        {(id, d) => (
          <PasswordInput id={id} aria-describedby={d} aria-invalid={!!errors.current_password} autoComplete="current-password" {...form.register("current_password")} />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" error={errors.new_password?.message} hint="8+ characters, a letter and a number">
          {(id, d) => (
            <PasswordInput id={id} aria-describedby={d} aria-invalid={!!errors.new_password} autoComplete="new-password" {...form.register("new_password")} />
          )}
        </Field>
        <Field label="Confirm new password" error={errors.confirm_password?.message}>
          {(id, d) => (
            <PasswordInput id={id} aria-describedby={d} aria-invalid={!!errors.confirm_password} autoComplete="new-password" {...form.register("confirm_password")} />
          )}
        </Field>
      </div>
      <div>
        <Button type="submit" variant="secondary" loading={isSubmitting}>
          Change password
        </Button>
      </div>
    </form>
  );
}

export function WeatherSettings({ user }: { user: UserOut }) {
  const update = useUpdateUser();
  const [locating, setLocating] = useState(false);

  const settings = useMutation({
    mutationFn: (body: { weather_auto_detect?: boolean; comment_policy?: CommentPolicy }) =>
      api<UserOut>("/users/me/settings", { method: "PATCH", body }),
    onSuccess: update,
    onError: (e) => toast.error(errorMessage(e)),
  });
  const clear = useMutation({
    mutationFn: () => api<UserOut>("/users/me/location", { method: "DELETE" }),
    onSuccess: (u) => {
      update(u);
      toast.success("Saved location cleared");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const saveLocation = useMutation({
    mutationFn: (coords: { lat: number; lon: number }) =>
      api<UserOut>("/users/me/location", { method: "PUT", body: { ...coords, source: "browser" } }),
    onSuccess: (u) => {
      update(u);
      toast.success(u.location_city ? `Location set to ${u.location_city}` : "Location saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  function locate() {
    if (!("geolocation" in navigator)) {
      toast.error("This browser can't share your location");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        saveLocation.mutate({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        toast.error("Location permission was denied");
      },
      { timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-medium">Detect weather automatically</p>
          <p className="text-[13px] text-muted">Prefills the weather and time of day when you ask for an outfit.</p>
        </div>
        <Switch
          label="Detect weather automatically"
          checked={user.weather_auto_detect}
          disabled={settings.isPending}
          onCheckedChange={(v) => settings.mutate({ weather_auto_detect: v })}
        />
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-4 text-muted" />
          <div>
            <p className="text-sm font-medium">{user.location_city ?? "No saved location"}</p>
            <p className="text-[13px] text-muted">Kept at city level and never shown to anyone.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" loading={locating || saveLocation.isPending} onClick={locate}>
            <LocateFixed />
            {user.location_city ? "Update" : "Use my location"}
          </Button>
          {user.location_city && (
            <Button size="sm" variant="ghost" loading={clear.isPending} onClick={() => clear.mutate()}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const POLICIES: { value: CommentPolicy; label: string; hint: string }[] = [
  { value: "everyone", label: "Everyone", hint: "Anyone can comment" },
  { value: "followers", label: "Followers", hint: "Only people who follow you" },
  { value: "off", label: "Off", hint: "No comments on new posts" },
];

export function CommentSettings({ user }: { user: UserOut }) {
  const update = useUpdateUser();
  const save = useMutation({
    mutationFn: (comment_policy: CommentPolicy) => api<UserOut>("/users/me/settings", { method: "PATCH", body: { comment_policy } }),
    onSuccess: update,
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Who can comment">
      {POLICIES.map((p) => {
        const on = user.comment_policy === p.value;
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={save.isPending}
            onClick={() => !on && save.mutate(p.value)}
            className={cn(
              "rounded-2xl border p-4 text-left transition",
              on ? "border-ink bg-surface ring-1 ring-ink" : "border-line hover:border-ink/40",
            )}
          >
            <p className="text-sm font-medium">{p.label}</p>
            <p className="mt-0.5 text-[13px] text-muted">{p.hint}</p>
          </button>
        );
      })}
    </div>
  );
}

const FEATURES: { key: QuotaFeature; label: string }[] = [
  { key: "generate", label: "Outfit ideas" },
  { key: "chat", label: "Stylist chat messages" },
  { key: "tag", label: "Photo scans" },
  { key: "render", label: "Doll renders" },
  { key: "avatar", label: "Selfie dolls" },
];

export function UsageCard({ usage }: { usage: AIUsage | undefined }) {
  if (!usage) return <div className="h-48 rounded-[var(--radius-card)] border border-line shimmer" />;
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-muted">Resets every day, selfie dolls every week.</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            usage.mode === "normal" && "bg-success-soft text-success",
            usage.mode === "saver" && "bg-warn-soft text-warn",
            usage.mode === "offline" && "bg-danger-soft text-danger",
          )}
        >
          {usage.mode === "normal" ? "All features on" : usage.mode === "saver" ? "Saver mode" : "Stylist resting"}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {FEATURES.map(({ key, label }) => {
          const q = usage.quotas[key];
          if (!q) return null;
          const pct = q.limit ? Math.min(q.used / q.limit, 1) : 1;
          return (
            <div key={key}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>{label}</span>
                <span className="text-muted tabular-nums">
                  {q.used} / {q.limit}
                  <span className="ml-1 text-faint">per {q.period}</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn("h-full rounded-full transition-[width]", q.remaining === 0 ? "bg-danger" : "bg-ink")}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
