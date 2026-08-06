"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

type AccessTokenCountdownProps = {
  initialExpiresAt: number | null;
};

function formatRemaining(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function AccessTokenCountdown({
  initialExpiresAt,
}: AccessTokenCountdownProps) {
  const { accessTokenExpiresAt } = useAuth();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const expiresAtMs = useMemo(() => {
    if (accessTokenExpiresAt) {
      const parsed = Date.parse(accessTokenExpiresAt);
      if (!Number.isNaN(parsed)) return parsed;
    }

    return initialExpiresAt ? initialExpiresAt * 1000 : null;
  }, [accessTokenExpiresAt, initialExpiresAt]);

  useEffect(() => {
    if (!expiresAtMs) return;

    const updateRemaining = () => {
      setRemainingSeconds(
        Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)),
      );
    };

    const initialTimer = window.setTimeout(updateRemaining, 0);
    const timer = window.setInterval(updateRemaining, 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [expiresAtMs]);

  if (remainingSeconds === null) return null;

  const expired = remainingSeconds === 0;
  const expiringSoon = remainingSeconds > 0 && remainingSeconds <= 60;

  return (
    <aside
      className={cn(
        "fixed right-4 bottom-4 z-30 flex items-center gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur sm:right-6 sm:bottom-6",
        expiringSoon && "border-amber-300 bg-amber-50/95 text-amber-950",
        expired && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
      aria-label={
        expired
          ? "Access token expired"
          : `Access token expires in ${formatRemaining(remainingSeconds)}`
      }
    >
      <span className="rounded-lg bg-muted p-2">
        <Clock3 className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          Access token
        </p>
        <p className="font-mono text-sm font-semibold tabular-nums">
          {expired
            ? "Expired"
            : `Expires in ${formatRemaining(remainingSeconds)}`}
        </p>
      </div>
    </aside>
  );
}
