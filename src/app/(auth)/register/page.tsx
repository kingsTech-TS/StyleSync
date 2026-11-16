"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DollStage } from "@/components/doll/doll-stage";
import { setAfterAuthRedirect } from "@/components/layout/guards";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { ErrorNote } from "@/components/ui/misc";
import { MatchHint, PasswordChecklist, PasswordInput } from "@/components/ui/password";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { AGE_RANGES } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { type RegisterValues, registerSchema } from "@/lib/validation/auth";

export default function RegisterPage() {
  const { register: signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const { errors, isSubmitting } = form.formState;
  const pw = form.watch("password") ?? "";
  const confirm = form.watch("confirm_password") ?? "";

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    // The auth layout redirects as soon as the session exists; tell it where new users go.
    setAfterAuthRedirect("/avatar?onboarding=1");
    try {
      await signUp(registerSchema.parse(values));
    } catch (e) {
      setAfterAuthRedirect(null);
      if (e instanceof ApiError) {
        for (const [field, msg] of Object.entries(e.fields)) {
          form.setError(field as keyof RegisterValues, { message: msg });
        }
        if (e.status === 409) {
          const field = /email/i.test(e.message) ? "email" : "username";
          form.setError(field, { message: e.message });
          return;
        }
        if (Object.keys(e.fields).length) return;
      }
      setError(errorMessage(e));
    }
  });

  return (
    <>
      <h1 className="font-display text-5xl tracking-tight">Create your account</h1>
      <p className="mt-3 text-muted">It takes a minute. Your doll comes next.</p>
      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5" noValidate>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Field label="Full name" error={errors.full_name?.message}>
          {(id, d) => (
            <Input id={id} aria-describedby={d} aria-invalid={!!errors.full_name} autoComplete="name" {...form.register("full_name")} />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Username" error={errors.username?.message}>
            {(id, d) => (
              <Input
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.username}
                autoCapitalize="none"
                autoComplete="username"
                {...form.register("username", {
                  onChange: (e) => {
                    e.target.value = e.target.value.toLowerCase().replace(/\s/g, "");
                  },
                })}
              />
            )}
          </Field>
          <Field label="Age range" error={errors.age_range?.message}>
            {(id, d) => (
              <Select id={id} aria-describedby={d} aria-invalid={!!errors.age_range} defaultValue="" {...form.register("age_range")}>
                <option value="" disabled>
                  Select
                </option>
                {AGE_RANGES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message}>
          {(id, d) => (
            <Input id={id} type="email" aria-describedby={d} aria-invalid={!!errors.email} autoComplete="email" {...form.register("email")} />
          )}
        </Field>

        <fieldset>
          <legend className="text-[13px] font-medium">Doll body</legend>
          <p className="mt-0.5 text-[13px] text-muted">Every outfit you make is shown on this body type.</p>
          <Controller
            control={form.control}
            name="sex"
            render={({ field }) => (
              <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup">
                {(["female", "male"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={field.value === s}
                    onClick={() => field.onChange(s)}
                    className={cn(
                      "group overflow-hidden rounded-2xl border-2 text-left transition",
                      field.value === s ? "border-ink" : "border-line hover:border-ink/30",
                    )}
                  >
                    <DollStage url={`/dolls/${s}.svg`} alt="" size="thumb" className="h-36 rounded-none" />
                    <span className="flex items-center justify-between px-3.5 py-2.5 text-sm font-medium">
                      {s === "female" ? "Female" : "Male"}
                      <span
                        className={cn(
                          "size-4 rounded-full border-2 transition",
                          field.value === s ? "border-ink bg-ink ring-2 ring-surface ring-inset" : "border-line",
                        )}
                      />
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.sex && <p className="mt-1.5 text-[13px] text-danger">{errors.sex.message}</p>}
        </fieldset>

        <div className="flex flex-col gap-3">
          <Field label="Password" error={errors.password?.message}>
            {(id, d) => (
              <PasswordInput
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.password}
                autoComplete="new-password"
                {...form.register("password")}
              />
            )}
          </Field>
          <PasswordChecklist value={pw} />
        </div>
        <div className="flex flex-col gap-2">
          <Field label="Confirm password" error={errors.confirm_password?.message}>
            {(id, d) => (
              <PasswordInput
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.confirm_password}
                autoComplete="new-password"
                {...form.register("confirm_password")}
              />
            )}
          </Field>
          {!errors.confirm_password && <MatchHint password={pw} confirm={confirm} />}
        </div>
        <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
          Create account
        </Button>
      </form>
      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  );
}
