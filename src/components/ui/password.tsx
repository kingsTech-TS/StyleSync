"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

/** Password input with a show/hide toggle. Works with react-hook-form's register(). */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-12", className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
    );
  },
);

// Same rules as the backend (app/core/security.py): 8+ characters, a letter and a number.
const RULES = [
  { label: "8 or more characters", test: (v: string) => v.length >= 8 },
  { label: "A letter", test: (v: string) => /[A-Za-z]/.test(v) },
  { label: "A number", test: (v: string) => /\d/.test(v) },
];

const BONUS = [
  { test: (v: string) => v.length >= 12 },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const LEVELS = [
  { label: "Too weak", bar: "bg-danger", text: "text-danger" },
  { label: "Too weak", bar: "bg-danger", text: "text-danger" },
  { label: "Almost there", bar: "bg-warn", text: "text-warn" },
  { label: "Good", bar: "bg-success", text: "text-success" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
  { label: "Very strong", bar: "bg-success", text: "text-success" },
];

/** Live strength bar and requirement checklist shown under a new password. */
export function PasswordChecklist({ value, className }: { value: string; className?: string }) {
  const passed = RULES.map((r) => r.test(value));
  const allRequired = passed.every(Boolean);
  const score = passed.filter(Boolean).length + (allRequired ? BONUS.filter((b) => b.test(value)).length : 0);
  const level = LEVELS[value ? score : 0];

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", value && i < score ? level.bar : "bg-surface-2")}
            />
          ))}
        </div>
        <span className={cn("w-24 text-right text-xs font-medium transition-colors", value ? level.text : "text-faint")} aria-live="polite">
          {value ? level.label : "Strength"}
        </span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {RULES.map((r, i) => (
          <li
            key={r.label}
            className={cn("flex items-center gap-1.5 text-[13px] transition-colors", passed[i] ? "text-success" : "text-muted")}
          >
            <span
              className={cn(
                "grid size-4 place-items-center rounded-full border transition-all duration-200",
                passed[i] ? "scale-100 border-success bg-success text-white" : "scale-90 border-line",
              )}
            >
              <Check className={cn("size-2.5 transition-opacity", passed[i] ? "opacity-100" : "opacity-0")} strokeWidth={3.5} />
            </span>
            {r.label}
            <span className="sr-only">{passed[i] ? "(done)" : "(not yet)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Passwords match" hint for a confirm field, shown once something is typed. */
export function MatchHint({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  const match = password === confirm;
  return (
    <p className={cn("flex items-center gap-1.5 text-[13px]", match ? "text-success" : "text-muted")} aria-live="polite">
      {match ? <Check className="size-3.5" strokeWidth={3} /> : null}
      {match ? "Passwords match" : "Keep typing to match"}
    </p>
  );
}
