"use client";

import { DropdownMenu as DM, Switch as S, Tabs as T, Tooltip as TT } from "radix-ui";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------- Badge ----------

const tones = {
  neutral: "bg-surface-2 text-ink",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  ink: "bg-ink text-bg",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------- Chips (single or multi choice) ----------

export function Chip({
  selected,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap transition [&_svg]:size-4",
        selected
          ? "border-ink bg-ink text-bg"
          : "border-line bg-surface text-ink hover:border-ink/40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------- Tabs ----------

export const Tabs = T.Root;
export const TabsContent = T.Content;

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <T.List className={cn("inline-flex rounded-full bg-surface-2 p-1", className)}>{children}</T.List>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <T.Trigger
      value={value}
      className="h-8 rounded-full px-4 text-sm font-medium text-muted transition data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-sm"
    >
      {children}
    </T.Trigger>
  );
}

// ---------- Switch ----------

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}) {
  return (
    <S.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className="relative h-6 w-10 shrink-0 rounded-full bg-surface-3 transition data-[state=checked]:bg-ink disabled:opacity-50"
    >
      <S.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-[18px]" />
    </S.Root>
  );
}

// ---------- Dropdown menu ----------

export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;

export function MenuContent({ children, align = "end" }: { children: React.ReactNode; align?: "start" | "end" }) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className="z-50 min-w-48 rounded-2xl border border-line bg-surface p-1.5 text-sm shadow-xl"
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function MenuItem({
  children,
  onSelect,
  danger,
  href,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  href?: string;
}) {
  const cls = cn(
    "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 outline-none select-none data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-muted",
    danger && "text-danger [&_svg]:text-danger",
  );
  if (href) {
    return (
      <DM.Item asChild className={cls}>
        <Link href={href}>{children}</Link>
      </DM.Item>
    );
  }
  return (
    <DM.Item className={cls} onSelect={onSelect}>
      {children}
    </DM.Item>
  );
}

export function MenuSeparator() {
  return <DM.Separator className="my-1 h-px bg-line" />;
}

// ---------- Tooltip ----------

export function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TT.Provider delayDuration={300}>
      <TT.Root>
        <TT.Trigger asChild>{children}</TT.Trigger>
        <TT.Portal>
          <TT.Content sideOffset={6} className="z-50 rounded-lg bg-ink px-2.5 py-1 text-xs text-bg">
            {label}
          </TT.Content>
        </TT.Portal>
      </TT.Root>
    </TT.Provider>
  );
}

// ---------- Layout helpers ----------

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-medium tracking-[0.14em] text-muted uppercase">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted [&_svg]:size-6">
          {icon}
        </div>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[var(--radius-card)] border border-line bg-surface p-5", className)}>
      {children}
    </div>
  );
}

export function ErrorNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger", className)} role="alert">
      {children}
    </div>
  );
}
