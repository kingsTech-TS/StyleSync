"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ErrorNote, Switch } from "@/components/ui/misc";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { AdminTheme } from "@/lib/api/types";
import { useCreateTheme, useUpdateTheme } from "@/lib/queries/admin";

// Mirrors ThemeIn in the backend (app/schemas/admin.py).
const schema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "At least 2 characters")
    .max(40)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters and numbers, separated by single dashes"),
  name: z.string().trim().min(2, "At least 2 characters").max(40),
  description: z.string().max(200, "200 characters max"),
  styling_rules: z.string().max(1000, "1000 characters max"),
  icon: z.string().max(40),
  sort_order: z.coerce.number<number>().int("Whole number"),
  is_active: z.boolean(),
});

type Values = z.infer<typeof schema>;

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = add a new theme */
  theme: AdminTheme | null;
  nextSortOrder: number;
}

export function ThemeDialog({ open, onOpenChange, theme, nextSortOrder }: Props) {
  const create = useCreateTheme();
  const update = useUpdateTheme();
  const isNew = !theme;
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  const { errors, isSubmitting, dirtyFields } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      slug: theme?.slug ?? "",
      name: theme?.name ?? "",
      description: theme?.description ?? "",
      styling_rules: theme?.styling_rules ?? "",
      icon: theme?.icon ?? "",
      sort_order: theme?.sort_order ?? nextSortOrder,
      is_active: theme?.is_active ?? true,
    });
  }, [open, theme, nextSortOrder, form]);

  const description = form.watch("description") ?? "";
  const rules = form.watch("styling_rules") ?? "";

  const onSubmit = form.handleSubmit(async (v) => {
    const body = { ...v, icon: v.icon.trim() || null };
    try {
      if (isNew) {
        await create.mutateAsync(body);
      } else {
        const { slug: _slug, ...rest } = body;
        await update.mutateAsync({ id: theme.id, ...rest });
        toast.success("Theme saved");
      }
      onOpenChange(false);
    } catch (e) {
      if (e instanceof ApiError) {
        for (const [field, msg] of Object.entries(e.fields)) form.setError(field as keyof Values, { message: msg });
        if (e.status === 409) {
          form.setError("slug", { message: e.message });
          return;
        }
      }
      form.setError("root", { message: errorMessage(e) });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isNew ? "Add a theme" : `Edit ${theme.name}`}
        description="Active themes appear in the outfit generator right away."
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {errors.root?.message && <ErrorNote>{errors.root.message}</ErrorNote>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message}>
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.name}
                  {...form.register("name", {
                    onChange: (e) => {
                      if (isNew && !dirtyFields.slug) form.setValue("slug", slugify(e.target.value));
                    },
                  })}
                />
              )}
            </Field>
            <Field
              label="Slug"
              error={errors.slug?.message}
              hint={isNew ? "Used in links and saved outfits" : "Can't be changed"}
            >
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.slug}
                  disabled={!isNew}
                  className="font-mono text-sm"
                  {...form.register("slug")}
                />
              )}
            </Field>
          </div>
          <Field label="Description" error={errors.description?.message} hint={`Shown in the theme picker · ${description.length}/200`}>
            {(id, d) => <Textarea id={id} aria-describedby={d} rows={2} className="min-h-0" {...form.register("description")} />}
          </Field>
          <Field
            label="Styling rules"
            error={errors.styling_rules?.message}
            hint={`What the stylist follows: formality, colors, fabrics, what to avoid · ${rules.length}/1000`}
          >
            {(id, d) => <Textarea id={id} aria-describedby={d} rows={5} {...form.register("styling_rules")} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Icon" error={errors.icon?.message} hint="Optional icon name">
              {(id, d) => <Input id={id} aria-describedby={d} {...form.register("icon")} />}
            </Field>
            <Field label="Sort order" error={errors.sort_order?.message} hint="Lower comes first">
              {(id, d) => <Input id={id} aria-describedby={d} type="number" inputMode="numeric" {...form.register("sort_order")} />}
            </Field>
          </div>
          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-surface-2 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">Active</span>
                  <span className="block text-xs text-muted">Inactive themes stay on old outfits but leave the picker.</span>
                </span>
                <Switch checked={!!field.value} onCheckedChange={field.onChange} label="Active" />
              </label>
            )}
          />
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={isSubmitting}>
              {isNew ? "Add theme" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
