"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Palette, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ThemeDialog } from "@/components/admin/theme-dialog";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, ErrorNote, PageHeader, Switch } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { AdminTheme } from "@/lib/api/types";
import { useAdminThemes, useUpdateTheme } from "@/lib/queries/admin";
import { qk } from "@/lib/queries/keys";
import { cn } from "@/lib/utils";

export default function AdminThemes() {
  const { data, isLoading, error } = useAdminThemes();
  const update = useUpdateTheme();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<AdminTheme | null>(null);
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);

  const themes = data ?? [];
  const nextSortOrder = themes.length ? Math.max(...themes.map((t) => t.sort_order)) + 10 : 10;

  /** Swap with a neighbour, then renumber 10, 20, 30… so ties never block a move. */
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= themes.length) return;
    const order = [...themes];
    [order[index], order[target]] = [order[target], order[index]];
    const changes = order
      .map((t, i) => ({ t, sort: (i + 1) * 10 }))
      .filter(({ t, sort }) => t.sort_order !== sort);
    qc.setQueryData<AdminTheme[]>(qk.admin.themes, order.map((t, i) => ({ ...t, sort_order: (i + 1) * 10 })));
    setMoving(true);
    try {
      await Promise.all(
        changes.map(({ t, sort }) => api(`/admin/themes/${t.id}`, { method: "PATCH", body: { sort_order: sort } })),
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setMoving(false);
      qc.invalidateQueries({ queryKey: qk.admin.themes });
      qc.invalidateQueries({ queryKey: qk.options });
    }
  }

  return (
    <>
      <PageHeader
        title="Themes"
        description="The occasions people pick in the outfit generator, in this order."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus />
            Add theme
          </Button>
        }
      />
      {error && <ErrorNote>{errorMessage(error)}</ErrorNote>}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !themes.length ? (
        <EmptyState icon={<Palette />} title="No themes yet" />
      ) : (
        <ol className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {themes.map((t, i) => (
            <li key={t.id} className={cn("flex items-center gap-3 border-b border-line px-3 py-3.5 last:border-0 sm:px-5", !t.is_active && "bg-surface-2/50")}>
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={`Move ${t.name} up`}
                  disabled={i === 0 || moving}
                  onClick={() => move(i, -1)}
                  className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-25"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${t.name} down`}
                  disabled={i === themes.length - 1 || moving}
                  onClick={() => move(i, 1)}
                  className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-25"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("font-medium", !t.is_active && "text-muted")}>{t.name}</span>
                  <span className="font-mono text-xs text-faint">{t.slug}</span>
                  {!t.is_active && <Badge>Inactive</Badge>}
                </div>
                {t.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{t.description}</p>}
                {!t.styling_rules && <p className="mt-0.5 text-xs text-warn">No styling rules yet</p>}
              </div>
              <span className="hidden text-xs text-faint tabular-nums sm:block">#{t.sort_order}</span>
              <Switch
                checked={t.is_active}
                label={`${t.name} active`}
                disabled={update.isPending && update.variables?.id === t.id}
                onCheckedChange={(v) =>
                  update.mutate(
                    { id: t.id, is_active: v },
                    { onSuccess: () => toast.success(v ? `${t.name} is in the picker` : `${t.name} is hidden from the picker`) },
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${t.name}`}
                onClick={() => {
                  setEditing(t);
                  setOpen(true);
                }}
              >
                <Pencil />
              </Button>
            </li>
          ))}
        </ol>
      )}
      <ThemeDialog open={open} onOpenChange={setOpen} theme={editing} nextSortOrder={nextSortOrder} />
    </>
  );
}
