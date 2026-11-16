"use client";

import { CircleAlert, CircleCheck, Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import { BarList, Meter } from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge, Card, ErrorNote, PageHeader } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/api/errors";
import type { AIMode, Quotas } from "@/lib/api/types";
import { useAIBudget, useQuotaConfig, useUpdateQuotas } from "@/lib/queries/admin";
import { titleCase } from "@/lib/utils";

const usd = (v: number) => `$${v.toFixed(v < 1 ? 3 : 2)}`;

const MODE: Record<AIMode, { label: string; tone: "success" | "warn" | "danger"; text: string }> = {
  normal: { label: "Normal", tone: "success", text: "All AI features run as designed." },
  saver: {
    label: "Saver",
    tone: "warn",
    text: "Over 70% used: no new web searches, cheaper renders, no premium re-render on publish.",
  },
  offline: {
    label: "Offline",
    tone: "danger",
    text: "Over 90% used: manual tagging, layered renders, and the stylist rests until the credit resets.",
  },
};

export default function AdminAI() {
  return (
    <>
      <PageHeader title="AI budget" description="Free gateway credit for this cycle, and the daily limits each person gets." />
      <Budget />
      <QuotaEditor />
    </>
  );
}

function Budget() {
  const { data, isLoading, error } = useAIBudget();
  if (error) return <ErrorNote className="mb-8">{errorMessage(error)}</ErrorNote>;
  if (isLoading || !data) return <Skeleton className="mb-8 h-72" />;
  const mode = MODE[data.mode] ?? MODE.normal;
  const runOut = data.projected_run_out ? new Date(data.projected_run_out) : null;

  return (
    <section className="mb-10 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Spent this {data.cycle_days}-day cycle</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">
              {usd(data.spent_usd)}
              <span className="ml-2 text-lg font-normal text-muted">of {usd(data.budget_usd)}</span>
            </p>
          </div>
          <Badge tone={mode.tone} className="text-sm">
            {data.mode === "normal" ? <CircleCheck /> : <CircleAlert />}
            {mode.label} mode
          </Badge>
        </div>
        <Meter
          className="mt-6"
          fraction={data.used_fraction}
          marks={[
            { at: 0.7, label: "Saver 70%" },
            { at: 0.9, label: "Offline 90%" },
          ]}
        />
        <p className="mt-2 text-sm text-muted">{mode.text}</p>
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5 text-sm">
          <div>
            <dt className="text-xs text-muted">Remaining</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{usd(data.remaining_usd)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">AI calls</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{data.calls.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Projected run-out</dt>
            <dd className="mt-0.5 font-semibold">
              {runOut && !Number.isNaN(runOut.getTime())
                ? runOut.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                : "Not at this pace"}
            </dd>
          </div>
        </dl>
      </Card>
      <div className="grid gap-3">
        <Card>
          <h3 className="mb-4 text-sm font-medium">Spend by model</h3>
          <BarList rows={Object.entries(data.by_model).map(([label, value]) => ({ label, value }))} format={usd} />
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-medium">Spend by feature</h3>
          <BarList
            rows={Object.entries(data.by_feature).map(([label, value]) => ({ label: titleCase(label), value }))}
            format={usd}
          />
        </Card>
      </div>
    </section>
  );
}

const FIELDS: { key: keyof Quotas; label: string; hint: string }[] = [
  { key: "tag", label: "Garment scans", hint: "Per person per day" },
  { key: "generate", label: "Outfit generations", hint: "Per person per day" },
  { key: "chat", label: "Chat messages", hint: "Per person per day" },
  { key: "render", label: "New doll renders", hint: "Per person per day (cache misses only)" },
  { key: "avatar_per_week", label: "Avatar from selfie", hint: "Per person per week" },
];

function QuotaEditor() {
  const { data, isLoading, error } = useQuotaConfig();
  const save = useUpdateQuotas();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) setValues(Object.fromEntries(FIELDS.map((f) => [f.key, String(data[f.key])])));
  }, [data]);

  const invalid = FIELDS.some((f) => {
    const n = Number(values[f.key]);
    const max = f.key === "avatar_per_week" ? 100 : 1000;
    return values[f.key] === "" || !Number.isInteger(n) || n < 0 || n > max;
  });
  const dirty = !!data && FIELDS.some((f) => String(data[f.key]) !== values[f.key]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data || invalid) return;
    const changed = Object.fromEntries(
      FIELDS.filter((f) => String(data[f.key]) !== values[f.key]).map((f) => [f.key, Number(values[f.key])]),
    );
    save.mutate(changed);
  }

  return (
    <section aria-labelledby="quota-h">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="size-5 text-muted" />
        <h2 id="quota-h" className="text-lg font-semibold tracking-tight">
          Quotas
        </h2>
      </div>
      {error && <ErrorNote>{errorMessage(error)}</ErrorNote>}
      {isLoading || !data ? (
        <Skeleton className="h-56" />
      ) : (
        <Card className="p-6">
          <form onSubmit={submit}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FIELDS.map((f) => (
                <Field key={f.key} label={f.label} hint={f.hint}>
                  {(id, d) => (
                    <Input
                      id={id}
                      aria-describedby={d}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={f.key === "avatar_per_week" ? 100 : 1000}
                      className="tabular-nums"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                </Field>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-5">
              {invalid && <p className="mr-auto text-sm text-danger">Use whole numbers from 0 to 1000 (100 for avatars).</p>}
              <Button
                type="button"
                variant="ghost"
                disabled={!dirty}
                onClick={() => setValues(Object.fromEntries(FIELDS.map((f) => [f.key, String(data[f.key])])))}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!dirty || invalid} loading={save.isPending}>
                Save quotas
              </Button>
            </div>
          </form>
        </Card>
      )}
    </section>
  );
}
