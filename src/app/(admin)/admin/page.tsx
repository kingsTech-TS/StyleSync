"use client";

import { CircleAlert, CircleCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  BarList,
  ChartCard,
  dayRange,
  fillDays,
  Legend,
  LineChart,
  SERIES_COLORS,
} from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import { Chip, ErrorNote, PageHeader } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/api/errors";
import { useAdminHealth, useAdminStats } from "@/lib/queries/admin";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

export default function AdminOverview() {
  return (
    <>
      <PageHeader title="Overview" description="System health right now, and activity over time." />
      <Health />
      <Stats />
    </>
  );
}

function Health() {
  const { data, isLoading, error, refetch, isFetching } = useAdminHealth();
  if (error) return <ErrorNote className="mb-10">{errorMessage(error)}</ErrorNote>;
  return (
    <section className="mb-12" aria-labelledby="health-h">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="health-h" className="text-lg font-semibold tracking-tight">
          System health
        </h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} loading={isFetching && !isLoading}>
          {!isFetching && <RefreshCw />}
          Refresh
        </Button>
      </div>
      {isLoading || !data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Service name="Database" up={data.database} />
            <Service name="Media storage" up={data.storage} />
            <Service name="AI gateway" up={data.ai_gateway} />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-5">
            <Metric label="Background tasks" value={data.background_tasks_pending.toLocaleString()} />
            <Metric label="AI calls · 24h" value={data.last_24h.ai_calls.toLocaleString()} />
            <Metric
              label="AI error rate · 24h"
              value={`${(data.last_24h.ai_error_rate * 100).toFixed(1)}%`}
              warn={data.last_24h.ai_error_rate >= 0.1}
            />
            <Metric
              label="Render failures · 24h"
              value={data.last_24h.render_failures.toLocaleString()}
              warn={data.last_24h.render_failures > 0}
            />
            <Metric label="AI cost · 24h" value={`$${data.last_24h.cost_usd.toFixed(2)}`} />
          </dl>
          <div className="mt-3 rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <h3 className="mb-4 text-sm font-medium">Average AI latency by model · 24h</h3>
            <BarList
              rows={Object.entries(data.last_24h.avg_latency_ms_by_model).map(([label, value]) => ({ label, value }))}
              format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${v} ms`)}
              empty="No AI calls in the last 24 hours."
            />
          </div>
        </>
      )}
    </section>
  );
}

function Service({ name, up }: { name: string; up: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-card)] border p-5",
        up ? "border-line bg-surface" : "border-danger/40 bg-danger-soft",
      )}
    >
      <span className={cn("grid size-10 place-items-center rounded-full", up ? "bg-success-soft text-success" : "bg-danger text-white")}>
        {up ? <CircleCheck className="size-5" /> : <CircleAlert className="size-5" />}
      </span>
      <div>
        <p className="text-sm text-muted">{name}</p>
        <p className={cn("font-semibold", up ? "text-success" : "text-danger")}>{up ? "Operational" : "Down"}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn("mt-1 text-xl font-semibold tracking-tight tabular-nums", warn && "text-warn")}>
        {warn && <CircleAlert className="mr-1.5 mb-0.5 inline size-4" aria-label="Needs attention" />}
        {value}
      </dd>
    </div>
  );
}

function Stats() {
  const [days, setDays] = useState<number>(7);
  const { data, isLoading, error, isPlaceholderData } = useAdminStats(days);
  const range = dayRange(days);

  const totals = data
    ? [
        ["Users", data.totals.users],
        ["Items", data.totals.items],
        ["Outfits", data.totals.outfits],
        ["Published", data.totals.published_outfits],
        ["Likes", data.totals.likes],
        ["Comments", data.totals.comments],
        ["Follows", data.totals.follows],
      ]
    : [];

  const sum = (v: number[]) => v.reduce((a, b) => a + b, 0).toLocaleString();

  return (
    <section aria-labelledby="stats-h">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="stats-h" className="text-lg font-semibold tracking-tight">
          Activity
        </h2>
        <div className="flex gap-2" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <Chip key={r} selected={days === r} onClick={() => setDays(r)}>
              {r} days
            </Chip>
          ))}
        </div>
      </div>
      {error && <ErrorNote>{errorMessage(error)}</ErrorNote>}
      {isLoading || !data ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          <dl className="mb-3 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-4 lg:grid-cols-7">
            {totals.map(([label, value]) => (
              <div key={label} className="bg-surface px-4 py-3.5">
                <dt className="text-xs text-muted">{label} · all time</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">{Number(value).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                ["users", "New users"],
                ["outfits", "Outfits created"],
                ["ai_calls", "AI calls"],
              ] as const
            ).map(([key, title]) => {
              const values = fillDays(data.per_day[key], range);
              return (
                <ChartCard key={key} title={title} total={sum(values)} days={range} columns={[{ label: title, values }]}>
                  <BarChart days={range} values={values} label={title} />
                </ChartCard>
              );
            })}
            <SocialChart range={range} perDay={data.per_day} />
          </div>
        </div>
      )}
    </section>
  );
}

function SocialChart({
  range,
  perDay,
}: {
  range: string[];
  perDay: Record<string, Record<string, number>>;
}) {
  const series = [
    { key: "likes", label: "Likes", color: SERIES_COLORS[0], values: fillDays(perDay.likes, range) },
    { key: "comments", label: "Comments", color: SERIES_COLORS[1], values: fillDays(perDay.comments, range) },
    { key: "follows", label: "Follows", color: SERIES_COLORS[2], values: fillDays(perDay.follows, range) },
  ];
  return (
    <ChartCard
      title="Social activity"
      days={range}
      legend={<Legend series={series} />}
      columns={series.map((s) => ({ label: s.label, values: s.values }))}
    >
      <LineChart days={range} series={series} />
    </ChartCard>
  );
}
