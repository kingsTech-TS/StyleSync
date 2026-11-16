"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password";
import { Field, Input } from "@/components/ui/input";
import { ErrorNote } from "@/components/ui/misc";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { loginSchema } from "@/lib/validation/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.identifier, values.password);
    } catch (e) {
      if (e instanceof ApiError && e.status === 423) setError("Too many tries. Your account is locked for a few minutes.");
      else setError(errorMessage(e));
    }
  });

  return (
    <>
      <h1 className="font-display text-5xl tracking-tight">Welcome back</h1>
      <p className="mt-3 text-muted">Log in with your email or username.</p>
      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5" noValidate>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Field label="Email or username" error={errors.identifier?.message}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.identifier}
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              {...form.register("identifier")}
            />
          )}
        </Field>
        <Field
          label={
            <span className="flex justify-between">
              Password
              <Link href="/forgot-password" className="font-normal text-muted hover:text-ink">
                Forgot it?
              </Link>
            </span>
          }
          error={errors.password?.message}
        >
          {(id, d) => (
            <PasswordInput
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.password}
              autoComplete="current-password"
              {...form.register("password")}
            />
          )}
        </Field>
        <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
          Log in
        </Button>
      </form>
      <p className="mt-8 text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-ink underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </>
  );
}
