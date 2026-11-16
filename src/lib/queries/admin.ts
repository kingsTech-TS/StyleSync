"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type {
  AdminHealth,
  AdminReport,
  AdminStats,
  AdminTheme,
  AdminUsersPage,
  AIBudget,
  OutfitOut,
  Quotas,
  ThemeIn,
  ThemeUpdateIn,
} from "@/lib/api/types";
import { qk } from "./keys";

export const USERS_PAGE_SIZE = 50;

export function useAdminHealth() {
  return useQuery({
    queryKey: qk.admin.health,
    queryFn: () => api<AdminHealth>("/admin/health"),
    refetchInterval: 60_000,
  });
}

export function useAdminStats(days: number) {
  return useQuery({
    queryKey: qk.admin.stats(days),
    queryFn: () => api<AdminStats>("/admin/stats", { query: { days } }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUsers(q: string, page: number) {
  return useQuery({
    queryKey: qk.admin.users(q, page),
    queryFn: () =>
      api<AdminUsersPage>("/admin/users", {
        query: { q: q || undefined, skip: page * USERS_PAGE_SIZE, limit: USERS_PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; is_active?: boolean; role?: "user" | "admin" }) =>
      api<{ id: string; is_active: boolean; role: string }>(`/admin/users/${id}`, { method: "PATCH", body }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      if (vars.is_active !== undefined) toast.success(vars.is_active ? "Account activated" : "Account deactivated");
      if (vars.role) toast.success(vars.role === "admin" ? "Now an admin" : "Admin rights removed");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function usePublishedOutfits() {
  return useQuery({
    queryKey: qk.admin.outfits,
    queryFn: () => api<OutfitOut[]>("/admin/outfits/published", { query: { limit: 200 } }),
  });
}

export function useTakeDown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/admin/outfits/${id}/publish`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.admin.outfits });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Outfit taken down");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useReports(status: "open" | "resolved") {
  return useQuery({
    queryKey: qk.admin.reports(status),
    queryFn: () => api<AdminReport[]>("/admin/reports", { query: { status } }),
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api(`/admin/reports/${id}`, { method: "PATCH", body: { note: note || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      toast.success("Report resolved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useModerateComment() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "visible" | "hidden" | "removed" }) =>
      api<{ detail: string }>(`/admin/comments/${id}`, { method: "PATCH", body: { status } }),
    onSuccess: (res) => toast.success(res.detail),
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useAdminThemes() {
  return useQuery({
    queryKey: qk.admin.themes,
    queryFn: () => api<AdminTheme[]>("/admin/themes"),
  });
}

function useInvalidateThemes() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.admin.themes });
    // the generator's theme picker reads /outfits/options
    qc.invalidateQueries({ queryKey: qk.options });
  };
}

export function useCreateTheme() {
  const invalidate = useInvalidateThemes();
  return useMutation({
    mutationFn: (body: ThemeIn) => api<AdminTheme>("/admin/themes", { body }),
    onSuccess: () => {
      invalidate();
      toast.success("Theme added");
    },
  });
}

export function useUpdateTheme() {
  const invalidate = useInvalidateThemes();
  return useMutation({
    mutationFn: ({ id, ...body }: ThemeUpdateIn & { id: string }) =>
      api<AdminTheme>(`/admin/themes/${id}`, { method: "PATCH", body }),
    onSuccess: invalidate,
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useAIBudget() {
  return useQuery({
    queryKey: qk.admin.budget,
    queryFn: () => api<AIBudget>("/admin/ai-budget"),
  });
}

export function useQuotaConfig() {
  return useQuery({
    queryKey: qk.admin.quotas,
    queryFn: () => api<Quotas>("/admin/ai-quotas"),
  });
}

export function useUpdateQuotas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Quotas>) => api<Quotas>("/admin/ai-quotas", { method: "PATCH", body }),
    onSuccess: (data) => {
      qc.setQueryData(qk.admin.quotas, data);
      qc.invalidateQueries({ queryKey: qk.quota });
      toast.success("Quotas saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
