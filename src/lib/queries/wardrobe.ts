"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { CollectionOut, ItemOut } from "@/lib/api/types";
import { qk } from "./keys";

export function useCollections() {
  return useQuery({
    queryKey: qk.collections,
    queryFn: () => api<CollectionOut[]>("/collections"),
  });
}

export interface ItemFilters {
  collection_id?: string;
  category?: string;
  color?: string;
}

export function useItems(filters: ItemFilters = {}) {
  const params: Record<string, string | undefined> = {
    collection_id: filters.collection_id || undefined,
    category: filters.category || undefined,
    color: filters.color?.trim() || undefined,
  };
  return useQuery({
    queryKey: qk.items(params),
    queryFn: () => api<ItemOut[]>("/items", { query: params }),
  });
}

/** Wardrobe changes ripple into collection counts, item lists and the AI quota. */
export function useInvalidateWardrobe() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.collections });
    qc.invalidateQueries({ queryKey: ["items"] });
    qc.invalidateQueries({ queryKey: ["item"] });
  };
}
