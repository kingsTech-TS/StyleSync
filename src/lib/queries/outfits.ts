"use client";

import { type QueryClient, type QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { OutfitOut, OutfitSource } from "@/lib/api/types";
import { qk } from "./keys";

export const MY_OUTFITS_PAGE = 24;

/** My outfits, paged with skip/limit. */
export function useMyOutfits(source?: OutfitSource) {
  return useInfiniteQuery({
    queryKey: qk.outfits({ source }),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<OutfitOut[]>("/outfits", { query: { source, limit: MY_OUTFITS_PAGE, skip: pageParam } }),
    getNextPageParam: (last, all) => (last.length < MY_OUTFITS_PAGE ? undefined : all.length * MY_OUTFITS_PAGE),
    // Fresh outfits render in the background; refresh the grid until they're done.
    refetchInterval: (q) =>
      q.state.data?.pages.some((p) => p.some((o) => o.render.status === "pending")) && q.state.dataUpdateCount < 60
        ? 4000
        : false,
  });
}

// ---------- cache patching shared by like / save / publish ----------

type Patch = (o: OutfitOut) => OutfitOut;

function isOutfit(v: unknown): v is OutfitOut {
  return !!v && typeof v === "object" && "render" in v && "source" in v;
}

/** Walks any cached shape (single, list, {items}, infinite pages) and patches the matching outfit. */
function patchData(data: unknown, id: string, fn: Patch): unknown {
  if (!data) return data;
  if (isOutfit(data)) return data.id === id ? fn(data) : data;
  if (Array.isArray(data)) {
    let changed = false;
    const next = data.map((d) => {
      const p = patchData(d, id, fn);
      if (p !== d) changed = true;
      return p;
    });
    return changed ? next : data;
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.pages)) {
      const pages = patchData(obj.pages, id, fn);
      return pages === obj.pages ? data : { ...obj, pages };
    }
    if (Array.isArray(obj.items)) {
      const items = patchData(obj.items, id, fn);
      return items === obj.items ? data : { ...obj, items };
    }
  }
  return data;
}

const OUTFIT_PREFIXES: QueryKey[] = [["feed"], ["saved"], ["outfits"], ["outfit"]];

export type Snapshot = [QueryKey, unknown][];

export function patchOutfitEverywhere(qc: QueryClient, id: string, fn: Patch): Snapshot {
  const snapshot: Snapshot = [];
  for (const prefix of OUTFIT_PREFIXES) {
    for (const [key, data] of qc.getQueriesData({ queryKey: prefix })) {
      snapshot.push([key, data]);
      const next = patchData(data, id, fn);
      if (next !== data) qc.setQueryData(key, next);
    }
  }
  return snapshot;
}

export function restoreSnapshot(qc: QueryClient, snapshot: Snapshot) {
  for (const [key, data] of snapshot) qc.setQueryData(key, data);
}

/** Removes an outfit from every cached list (after delete or take-down). */
export function removeOutfitEverywhere(qc: QueryClient, id: string) {
  const strip = (data: unknown): unknown => {
    if (!data) return data;
    if (Array.isArray(data)) return data.filter((d) => !(isOutfit(d) && d.id === id)).map(strip);
    if (typeof data === "object" && !isOutfit(data)) {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.pages)) return { ...obj, pages: obj.pages.map(strip) };
      if (Array.isArray(obj.items)) return { ...obj, items: strip(obj.items) };
    }
    return data;
  };
  for (const prefix of [["feed"], ["saved"], ["outfits"]] as QueryKey[]) {
    qc.setQueriesData({ queryKey: prefix }, strip);
  }
  qc.removeQueries({ queryKey: qk.outfit(id) });
}
