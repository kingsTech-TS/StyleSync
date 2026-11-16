"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ErrorNote } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/auth/forgot-password", { body: { email: email.trim() } });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-5xl tracking-tight">Reset your password</h1>
      {sent ? (
        <>
          <p className="mt-3 text-muted">
            If an account uses <span className="text-ink">{email}</span>, a reset link is on its way. It works for one
            hour.
          </p>
          <Button asChild variant="secondary" size="lg" className="mt-10 w-full">
            <Link href="/login">Back to log in</Link>
          </Button>
        </>
      ) : (
        <>
          <p className="mt-3 text-muted">Enter your email and we&apos;ll send you a link.</p>
          <form onSubmit={submit} className="mt-10 flex flex-col gap-5">
            {error && <ErrorNote>{error}</ErrorNote>}
            <Field label="Email">
              {(id) => (
                <Input id={id} type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              )}
            </Field>
            <Button type="submit" size="lg" loading={loading}>
              Send reset link
            </Button>
          </form>
          <p className="mt-8 text-sm text-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-ink underline underline-offset-4">
              Log in
            </Link>
          </p>
        </>
      )}
    </>
  );
}
