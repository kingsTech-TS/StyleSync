"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { AuthProvider } from "@/lib/auth/auth-context";
import { qk } from "@/lib/queries/keys";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => {
    const qc: QueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 15_000,
          refetchOnWindowFocus: false,
          retry: (count, error) => {
            if (error instanceof ApiError && error.status < 500) return false;
            return count < 2;
          },
        },
      },
      mutationCache: new MutationCache({
        onError: (error) => {
          // A quota or rate-limit error means the remaining counts changed.
          if (error instanceof ApiError && (error.status === 429 || error.status === 503)) {
            qc.invalidateQueries({ queryKey: qk.quota });
          }
        },
      }),
    });
    return qc;
  });

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "bg-ink! text-bg! border-0! rounded-2xl! shadow-xl! font-sans!",
            description: "text-bg/70!",
            actionButton: "bg-accent! text-accent-ink!",
          },
        }}
      />
    </QueryClientProvider>
  );
}
