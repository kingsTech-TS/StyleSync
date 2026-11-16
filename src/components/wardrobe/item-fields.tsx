"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/input";
import { Chip } from "@/components/ui/misc";
import { CATEGORIES, type Category, type ItemOut } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL } from "./category";

export interface ItemDraft {
  name: string;
  primary_color: string;
  color_hex: string | null;
  category: Category;
  subcategory: string;
  pattern: string;
  material: string;
  formality: number | null;
  warmth: number | null;
  seasons: string[];
  style_tags: string[];
}

export type DraftKey = keyof ItemDraft;

const SEASONS = ["spring", "summer", "fall", "winter"];
const HEX = /^#[0-9a-f]{6}$/i;

export function draftFromItem(item: ItemOut): ItemDraft {
  return {
    name: item.name,
    primary_color: item.primary_color,
    color_hex: item.color_hex ?? null,
    category: item.category,
    subcategory: item.subcategory ?? "",
    pattern: item.pattern ?? "",
    material: item.material ?? "",
    formality: item.formality ?? null,
    warmth: item.warmth ?? null,
    seasons: item.seasons ?? [],
    style_tags: item.style_tags ?? [],
  };
}

/** Turns an AI suggestion into a draft, and reports which fields it filled. */
export function draftFromSuggestion(
  suggestion: Record<string, unknown> | null | undefined,
  fallbackCategory: Category,
): { draft: ItemDraft; filled: Set<DraftKey> } {
  const s = suggestion ?? {};
  const filled = new Set<DraftKey>();
  const str = (k: string) => (typeof s[k] === "string" ? (s[k] as string) : "");
  const num = (k: string) => (typeof s[k] === "number" ? Math.min(5, Math.max(1, Math.round(s[k] as number))) : null);
  const list = (k: string) => (Array.isArray(s[k]) ? (s[k] as unknown[]).filter((x): x is string => typeof x === "string") : []);
  const cat = str("category") as Category;
  const hex = str("color_hex");

  const draft: ItemDraft = {
    name: str("name"),
    primary_color: str("primary_color"),
    color_hex: HEX.test(hex) ? hex.toLowerCase() : null,
    category: CATEGORIES.includes(cat) ? cat : fallbackCategory,
    subcategory: str("subcategory"),
    pattern: str("pattern"),
    material: str("material"),
    formality: num("formality"),
    warmth: num("warmth"),
    seasons: list("seasons").map((x) => (x.toLowerCase() === "autumn" ? "fall" : x.toLowerCase())),
    style_tags: list("style_tags"),
  };
  for (const [k, v] of Object.entries(draft) as [DraftKey, unknown][]) {
    if (k === "category" ? CATEGORIES.includes(cat) : Array.isArray(v) ? v.length > 0 : v !== null && v !== "") {
      filled.add(k);
    }
  }
  return { draft, filled };
}

/** The request body shared by create and update. Empty optional fields are left out. */
export function draftToBody(d: ItemDraft) {
  return {
    name: d.name.trim(),
    primary_color: d.primary_color.trim(),
    color_hex: d.color_hex && HEX.test(d.color_hex) ? d.color_hex : null,
    category: d.category,
    subcategory: d.subcategory.trim() || null,
    pattern: d.pattern.trim() || null,
    material: d.material.trim() || null,
    formality: d.formality,
    warmth: d.warmth,
    seasons: d.seasons,
    style_tags: d.style_tags,
  };
}

function AiTag({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-1.5 rounded-md bg-surface-2 px-1.5 py-px align-middle text-[10px] font-semibold tracking-wider text-muted">
      AI
    </span>
  );
}

interface Props {
  value: ItemDraft;
  onChange: (next: ItemDraft) => void;
  /** Fields the AI filled in; the tag disappears once the user edits them. */
  aiFilled?: Set<DraftKey>;
  onEdited?: (key: DraftKey) => void;
  defaultOpenDetails?: boolean;
}

export function ItemFields({ value, onChange, aiFilled, onEdited, defaultOpenDetails }: Props) {
  const [details, setDetails] = useState(!!defaultOpenDetails);
  const [tagsText, setTagsText] = useState(value.style_tags.join(", "));
  const set = <K extends DraftKey>(key: K, v: ItemDraft[K]) => {
    onChange({ ...value, [key]: v });
    onEdited?.(key);
  };
  const ai = (k: DraftKey) => !!aiFilled?.has(k);

  return (
    <div className="flex flex-col gap-5">
      <Field label={<>Name<AiTag show={ai("name")} /></>}>
        {(id) => (
          <Input id={id} value={value.name} maxLength={80} placeholder="Navy oxford shirt" onChange={(e) => set("name", e.target.value)} />
        )}
      </Field>

      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <Field label={<>Color<AiTag show={ai("primary_color") || ai("color_hex")} /></>}>
          {(id) => (
            <Input
              id={id}
              value={value.primary_color}
              maxLength={40}
              placeholder="Navy blue"
              onChange={(e) => set("primary_color", e.target.value)}
            />
          )}
        </Field>
        <label className="relative grid size-11 cursor-pointer place-items-center rounded-xl border border-line bg-surface">
          <span className="sr-only">Pick the exact color</span>
          <span
            className="size-7 rounded-full ring-1 ring-black/10"
            style={{ background: value.color_hex ?? "conic-gradient(#e45 0 25%, #fc3 0 50%, #3b7 0 75%, #38d 0)" }}
          />
          <input
            type="color"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={value.color_hex ?? "#888888"}
            onChange={(e) => set("color_hex", e.target.value)}
          />
        </label>
      </div>

      <Field label={<>Category<AiTag show={ai("category")} /></>}>
        {(id) => (
          <Select id={id} value={value.category} onChange={(e) => set("category", e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="rounded-2xl border border-line">
        <button
          type="button"
          aria-expanded={details}
          onClick={() => setDetails((d) => !d)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        >
          More details
          <ChevronDown className={cn("size-4 text-muted transition", details && "rotate-180")} />
        </button>
        {details && (
          <div className="flex flex-col gap-5 border-t border-line px-4 pt-4 pb-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label={<>Type<AiTag show={ai("subcategory")} /></>}>
                {(id) => <Input id={id} value={value.subcategory} maxLength={40} placeholder="Chinos" onChange={(e) => set("subcategory", e.target.value)} />}
              </Field>
              <Field label={<>Pattern<AiTag show={ai("pattern")} /></>}>
                {(id) => <Input id={id} value={value.pattern} maxLength={40} placeholder="Solid" onChange={(e) => set("pattern", e.target.value)} />}
              </Field>
            </div>
            <Field label={<>Material<AiTag show={ai("material")} /></>}>
              {(id) => <Input id={id} value={value.material} maxLength={40} placeholder="Cotton" onChange={(e) => set("material", e.target.value)} />}
            </Field>
            <Scale
              label={<>Formality<AiTag show={ai("formality")} /></>}
              low="Relaxed"
              high="Formal"
              value={value.formality}
              onChange={(v) => set("formality", v)}
            />
            <Scale
              label={<>Warmth<AiTag show={ai("warmth")} /></>}
              low="Light"
              high="Warm"
              value={value.warmth}
              onChange={(v) => set("warmth", v)}
            />
            <div>
              <p className="mb-2 text-[13px] font-medium">
                Seasons
                <AiTag show={ai("seasons")} />
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([...SEASONS, ...value.seasons])).map((s) => {
                  const on = value.seasons.includes(s);
                  return (
                    <Chip
                      key={s}
                      selected={on}
                      onClick={() => set("seasons", on ? value.seasons.filter((x) => x !== s) : [...value.seasons, s])}
                    >
                      {s[0].toUpperCase() + s.slice(1)}
                    </Chip>
                  );
                })}
              </div>
            </div>
            <Field label={<>Style tags<AiTag show={ai("style_tags")} /></>} hint="Separate with commas">
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  value={tagsText}
                  placeholder="minimal, business"
                  onChange={(e) => {
                    setTagsText(e.target.value);
                    set(
                      "style_tags",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim().toLowerCase())
                        .filter(Boolean),
                    );
                  }}
                />
              )}
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

function Scale({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: React.ReactNode;
  low: string;
  high: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium">{label}</p>
      <div className="flex gap-1.5" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 5`}
            onClick={() => onChange(value === n ? null : n)}
            className={cn(
              "h-9 flex-1 rounded-xl border text-sm tabular-nums transition",
              value !== null && n <= value ? "border-ink bg-ink text-bg" : "border-line hover:border-ink/40",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
