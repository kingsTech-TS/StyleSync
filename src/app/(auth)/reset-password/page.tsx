"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password";
import { Field, Input } from "@/components/ui/input";
import { ErrorNote } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { resetSchema } from "@/lib/validation/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const token = useSearchParams().get("token");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await api("/auth/reset-password", { body: { token, ...values } });
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  if (!token) {
    return (
      <>
        <h1 className="font-display text-5xl tracking-tight">Link missing</h1>
        <p className="mt-3 text-muted">Open the reset link from your email again, or request a new one.</p>
        <Button asChild size="lg" className="mt-10">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </>
    );
  }

  if (done) {
    return (
      <>
        <h1 className="font-display text-5xl tracking-tight">Password changed</h1>
        <p className="mt-3 text-muted">You can log in with your new password now.</p>
        <Button asChild size="lg" className="mt-10">
          <Link href="/login">Log in</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-5xl tracking-tight">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5" noValidate>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Field label="New password" error={errors.password?.message} hint="8+ characters with a letter and a number">
          {(id, d) => <PasswordInput id={id} aria-describedby={d} autoComplete="new-password" autoFocus {...form.register("password")} />}
        </Field>
        <Field label="Confirm password" error={errors.confirm_password?.message}>
          {(id, d) => <PasswordInput id={id} aria-describedby={d} autoComplete="new-password" {...form.register("confirm_password")} />}
        </Field>
        <Button type="submit" size="lg" loading={isSubmitting}>
          Save password
        </Button>
      </form>
    </>
  );
}
