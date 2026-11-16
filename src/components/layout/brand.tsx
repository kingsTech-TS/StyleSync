import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("font-display text-[24px] leading-none tracking-[0.01em]", className)}>
      Style<span className="text-accent">sync</span>
    </Link>
  );
}

export function UserAvatar({
  url,
  username,
  className,
}: {
  url?: string | null;
  username?: string | null;
  className?: string;
}) {
  // The avatar image is the full-body doll; crop to the head like a character portrait.
  return (
    <span
      className={cn(
        "doll-stage relative inline-block size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-line",
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={username ? `${username}'s doll` : ""}
          className="absolute top-[-15%] left-1/2 w-[260%] max-w-none -translate-x-1/2"
        />
      ) : (
        <span className="grid h-full w-full place-items-center text-xs font-semibold text-muted uppercase">
          {username?.[0] ?? "?"}
        </span>
      )}
    </span>
  );
}
