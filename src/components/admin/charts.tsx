"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Chart colors: the dataviz reference palette's first three categorical slots, validated
 * (scripts/validate_palette.js, --pairs all) against this app's surfaces: light #ffffff, dark #1b1916.
 * Light aqua sits at 2.82:1, so multi-series charts carry direct labels and a table view.
 */
const VIZ_CSS = `
.viz-root { --viz-1:#2a78d6; --viz-2:#eb6834; --viz-3:#1baf7a; }
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) .viz-root { --viz-1:#3987e5; --viz-2:#d95926; --viz-3:#199e70; }
}
:root[data-theme="dark"] .viz-root { --viz-1:#3987e5; --viz-2:#d95926; --viz-3:#199e70; }
`;

export function VizStyles() {
  return <style dangerouslySetInnerHTML={{ __html: VIZ_CSS }} />;
}

export const SERIES_COLORS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)"];

// ---------- helpers ----------

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Every UTC day in the window, oldest first, as YYYY-MM-DD. */
export function dayRange(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = days - 1; i >= 0; i--) out.push(new Date(base - i * 86400000).toISOString().slice(0, 10));
  return out;
}

export function fillDays(series: Record<string, number> | undefined, days: string[]): number[] {
  return days.map((d) => series?.[d] ?? 0);
}

/** A round axis top with an even midpoint: 2 × a 1/2/5 × 10ⁿ step. */
function niceMax(max: number): number {
  if (max <= 2) return 2;
  const raw = max / 2;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return step * 2;
}

const dayFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
export function formatDay(d: string): string {
  return dayFmt.format(new Date(`${d}T00:00:00Z`));
}

const PAD = { top: 12, right: 12, bottom: 24, left: 36 };

function Axis({ width, height, max }: { width: number; height: number; max: number }) {
  const ticks = [0, max / 2, max];
  const innerH = height - PAD.top - PAD.bottom;
  return (
    <g aria-hidden>
      {ticks.map((t) => {
        const y = PAD.top + innerH - (t / max) * innerH;
        return (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y}
              y2={y}
              stroke="var(--line)"
              strokeDasharray={t === 0 ? undefined : "2 4"}
            />
            <text x={PAD.left - 8} y={y} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {Number.isInteger(t) ? t.toLocaleString() : t.toFixed(1)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function XLabels({ days, x, height }: { days: string[]; x: (i: number) => number; height: number }) {
  const idx = days.length <= 2 ? days.map((_, i) => i) : [0, Math.floor((days.length - 1) / 2), days.length - 1];
  return (
    <g aria-hidden>
      {idx.map((i, n) => (
        <text
          key={i}
          x={x(i)}
          y={height - 6}
          textAnchor={n === 0 ? "start" : n === idx.length - 1 ? "end" : "middle"}
          className="fill-muted text-[11px]"
        >
          {formatDay(days[i])}
        </text>
      ))}
    </g>
  );
}

function Tooltip({ left, children }: { left: number; children: React.ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 min-w-32 rounded-xl bg-ink px-3 py-2 text-xs text-bg shadow-lg"
      style={{ left, transform: "translateX(-50%)" }}
      role="status"
    >
      {children}
    </div>
  );
}

// ---------- single-series columns ----------

export function BarChart({
  days,
  values,
  label,
  color = SERIES_COLORS[0],
  height = 168,
}: {
  days: string[];
  values: number[];
  label: string;
  color?: string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...values));
  const innerW = Math.max(width - PAD.left - PAD.right, 0);
  const innerH = height - PAD.top - PAD.bottom;
  const slot = days.length ? innerW / days.length : 0;
  const gap = Math.max(2, slot * 0.25);
  const barW = Math.max(slot - gap, 1);
  const x = (i: number) => PAD.left + i * slot + slot / 2;

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${label} per day`}>
          <Axis width={width} height={height} max={max} />
          {values.map((v, i) => {
            const h = (v / max) * innerH;
            const bx = x(i) - barW / 2;
            const by = PAD.top + innerH - h;
            const r = Math.min(4, barW / 2, h);
            return (
              <path
                key={days[i]}
                d={
                  h <= 0
                    ? ""
                    : `M${bx},${PAD.top + innerH}V${by + r}Q${bx},${by} ${bx + r},${by}H${bx + barW - r}Q${bx + barW},${by} ${bx + barW},${by + r}V${PAD.top + innerH}Z`
                }
                fill={color}
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
            );
          })}
          <XLabels days={days} x={x} height={height} />
          {days.map((d, i) => (
            <rect
              key={d}
              x={PAD.left + i * slot}
              y={PAD.top}
              width={slot}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tooltip left={Math.min(Math.max(x(hover), 70), width - 70)}>
          <p className="text-bg/70">{formatDay(days[hover])}</p>
          <p className="mt-0.5 font-medium tabular-nums">
            {values[hover].toLocaleString()} {label.toLowerCase()}
          </p>
        </Tooltip>
      )}
    </div>
  );
}

// ---------- multi-series lines ----------

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

export function LineChart({ days, series, height = 200 }: { days: string[]; series: LineSeries[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const labelSpace = 72;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const innerW = Math.max(width - PAD.left - PAD.right - labelSpace, 0);
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (days.length <= 1 ? innerW / 2 : (i / (days.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  // Direct labels at the line ends, pushed apart so they never overlap.
  const endLabels = useMemo(() => {
    const items = series
      .map((s) => ({ key: s.key, label: s.label, color: s.color, y: y(s.values[s.values.length - 1] ?? 0) }))
      .sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) {
      if (items[i].y - items[i - 1].y < 14) items[i].y = items[i - 1].y + 14;
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, max, height, width]);

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.round(rel * (days.length - 1)));
  }

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${series.map((s) => s.label).join(", ")} per day`}>
          <Axis width={width - labelSpace} height={height} max={max} />
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--faint)" strokeWidth={1} />
          )}
          {series.map((s) => (
            <path
              key={s.key}
              d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join("")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {hover !== null &&
            series.map((s) => (
              <circle
                key={s.key}
                cx={x(hover)}
                cy={y(s.values[hover] ?? 0)}
                r={4}
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
          {endLabels.map((l) => (
            <text key={l.key} x={PAD.left + innerW + 8} y={l.y} dy="0.32em" className="fill-ink text-[11px] font-medium">
              {l.label}
            </text>
          ))}
          <XLabels days={days} x={x} height={height} />
          <rect
            x={PAD.left}
            y={PAD.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={onMove}
            onTouchMove={(e) => {
              const t = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              setHover(Math.round(Math.min(Math.max((t.clientX - rect.left) / rect.width, 0), 1) * (days.length - 1)));
            }}
          />
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tooltip left={Math.min(Math.max(x(hover), 80), width - 80)}>
          <p className="mb-1 text-bg/70">{formatDay(days[hover])}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2 tabular-nums">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              <span className="flex-1">{s.label}</span>
              <span className="font-medium">{(s.values[hover] ?? 0).toLocaleString()}</span>
            </p>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

export function Legend({ series }: { series: Pick<LineSeries, "key" | "label" | "color">[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

// ---------- chart card with a table view ----------

export function ChartCard({
  title,
  total,
  legend,
  days,
  columns,
  children,
}: {
  title: string;
  total?: React.ReactNode;
  legend?: React.ReactNode;
  days: string[];
  columns: { label: string; values: number[] }[];
  children: React.ReactNode;
}) {
  const [table, setTable] = useState(false);
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {total !== undefined && <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{total}</p>}
        </div>
        <button
          type="button"
          onClick={() => setTable((t) => !t)}
          className="rounded-full px-2.5 py-1 text-xs text-muted transition hover:bg-surface-2 hover:text-ink"
          aria-pressed={table}
        >
          {table ? "Chart" : "Table"}
        </button>
      </header>
      {legend && !table && <div className="mb-3">{legend}</div>}
      {table ? (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-xs tabular-nums">
            <thead className="sticky top-0 bg-surface text-left text-muted">
              <tr>
                <th className="py-1.5 font-medium">Day</th>
                {columns.map((c) => (
                  <th key={c.label} className="py-1.5 text-right font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days
                .map((d, i) => ({ d, i }))
                .reverse()
                .map(({ d, i }) => (
                  <tr key={d} className="border-t border-line">
                    <td className="py-1.5">{formatDay(d)}</td>
                    {columns.map((c) => (
                      <td key={c.label} className="py-1.5 text-right">
                        {c.values[i].toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

// ---------- horizontal bar list (spend/latency by model) ----------

export function BarList({
  rows,
  format,
  empty = "No data yet",
}: {
  rows: { label: string; value: number }[];
  format: (v: number) => string;
  empty?: string;
}) {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const max = Math.max(0, ...sorted.map((r) => r.value));
  if (!sorted.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate font-mono text-xs text-muted" title={r.label}>
              {r.label}
            </span>
            <span className="shrink-0 font-medium tabular-nums">{format(r.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-[var(--viz-1)]"
              style={{ width: `${max ? Math.max((r.value / max) * 100, 2) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------- budget meter with threshold marks ----------

export function Meter({
  fraction,
  marks = [],
  className,
}: {
  fraction: number;
  marks?: { at: number; label: string }[];
  className?: string;
}) {
  const pct = Math.min(Math.max(fraction, 0), 1) * 100;
  const tone = fraction >= 0.9 ? "bg-danger" : fraction >= 0.7 ? "bg-warn" : "bg-ink";
  return (
    <div className={cn("relative pb-6", className)}>
      <div
        className="h-3 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Credit used"
      >
        <div className={cn("h-full rounded-full transition-[width]", tone)} style={{ width: `${pct}%` }} />
      </div>
      {marks.map((m) => (
        <div key={m.at} className="absolute top-0" style={{ left: `${m.at * 100}%` }}>
          <div className="h-3 w-0.5 -translate-x-1/2 bg-surface" />
          <span className="absolute top-4 -translate-x-1/2 text-[11px] whitespace-nowrap text-muted">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
