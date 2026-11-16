"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";

// Outside (auth) on purpose: people often open this link while already logged in.
export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-12">
      <Wordmark />
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
        <Suspense>
          <Verify />
        </Suspense>
      </div>
    </div>
  );
}

function Verify() {
  const token = useSearchParams().get("token");
  const { status } = useAuth();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("");
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    api("/auth/verify-email", { body: { token } })
      .then(() => setState("done"))
      .catch((e) => {
        setMessage(errorMessage(e));
        setState("error");
      });
  }, [token]);

  const next = status === "authenticated" ? "/feed" : "/login";

  if (!token || state === "error") {
    return (
      <>
        <h1 className="font-display text-5xl tracking-tight">That link didn&apos;t work</h1>
        <p className="mt-3 text-muted">{message || "The link is missing its token."} You can send a new one from the app.</p>
        <Button asChild size="lg" className="mt-10">
          <Link href={next}>Continue</Link>
        </Button>
      </>
    );
  }
  if (state === "working") {
    return (
      <div className="flex items-center gap-3 text-muted">
        <Spinner /> Verifying your email
      </div>
    );
  }
  return (
    <>
      <h1 className="font-display text-5xl tracking-tight">Email verified</h1>
      <p className="mt-3 text-muted">Thanks. Your account is all set.</p>
      <Button asChild size="lg" className="mt-10">
        <Link href={next}>Continue</Link>
      </Button>
    </>
  );
}
