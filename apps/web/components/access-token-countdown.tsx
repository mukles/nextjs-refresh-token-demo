"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

type AccessTokenCountdownProps = {
  initialExpiresAt?: number | null;
  variant?: "compact" | "floating";
};

function formatRemaining(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function AccessTokenCountdown({
  initialExpiresAt = null,
  variant = "floating",
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
    const update = () =>
      setRemainingSeconds(
        Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000)),
      );
    const initialTimer = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [expiresAtMs]);

  if (remainingSeconds === null) return null;
  const expired = remainingSeconds === 0;
  const expiringSoon = remainingSeconds > 0 && remainingSeconds <= 60;
  const label = expired ? "Expired" : formatRemaining(remainingSeconds);

  return (
    <aside
      className={cn(
        "flex items-center border bg-white/95 tabular-nums backdrop-blur",
        variant === "floating"
          ? "fixed right-4 bottom-4 z-30 gap-3 rounded-xl px-4 py-3 shadow-lg sm:right-6 sm:bottom-6"
          : "gap-1.5 rounded-full px-2.5 py-1.5 text-xs",
        expiringSoon && "border-amber-300 bg-amber-50 text-amber-950",
        expired && "border-red-300 bg-red-50 text-red-700",
      )}
      aria-label={
        expired ? "Access token expired" : `Access token expires in ${label}`
      }
      title="Access token expiration time"
    >
      <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
      {variant === "floating" && (
        <span className="text-xs text-stone-500">Access token</span>
      )}
      <strong className="font-mono">{expired ? "Expired" : label}</strong>
    </aside>
  );
}
