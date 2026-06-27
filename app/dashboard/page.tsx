"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAutoRefresh } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Me = { id: string; email: string; name: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [log, setLog] = useState<string[]>([]);
  const [calling, setCalling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const addLog = useCallback((line: string) => {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => [`${time} — ${line}`, ...prev].slice(0, 12));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const handleAuthFailure = useCallback(
    async (res: Response) => {
      const data = await res.json().catch(() => ({}));
      if (data.code === "REUSE_DETECTED") {
        toast.error("🚨 Token reuse detected — session revoked. Logging out.");
      } else {
        toast.error(data.error ?? "Session expired. Please log in again.");
      }
      router.push("/login");
    },
    [router],
  );

  const callProtected = useCallback(async () => {
    setCalling(true);
    try {
      const { res, didRefresh } = await fetchWithAutoRefresh("/api/auth/me");
      if (!res.ok) return handleAuthFailure(res);

      const data = await res.json();
      setUser(data.user);
      setExpiresAt(data.accessTokenExpiresAt ?? null);
      if (didRefresh) {
        addLog("Access token was expired → silently refreshed, then retried ✅");
        toast.success("Access token silently refreshed");
      } else {
        addLog("Protected API call succeeded with current access token ✅");
      }
    } finally {
      setCalling(false);
    }
  }, [addLog, handleAuthFailure]);

  const forceRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return handleAuthFailure(res);
      const data = await res.json();
      setUser(data.user);
      addLog("Forced /api/auth/refresh → refresh token ROTATED 🔁");
      toast.success("Refreshed — refresh-token value rotated");
      await callProtected();
    } finally {
      setRefreshing(false);
    }
  }, [addLog, handleAuthFailure, callProtected]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Logged out — token family revoked");
    router.push("/login");
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    callProtected();
  }, [callProtected]);

  const secondsLeft = expiresAt ? expiresAt - now : null;
  const expired = secondsLeft !== null && secondsLeft <= 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {user ? `Signed in as ${user.name} (${user.email})` : "Loading…"}
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access token</CardTitle>
          <CardDescription>
            Short-lived JWT (60s). Stored in an httpOnly cookie — JavaScript
            cannot read it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-mono ${expired ? "text-destructive" : ""}`}
          >
            {secondsLeft === null
              ? "—"
              : expired
                ? "expired"
                : `${secondsLeft}s left`}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            When expired, “Call protected API” returns 401 → the client silently
            refreshes and retries. You never get logged out.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={callProtected} disabled={calling || refreshing}>
          {calling && <Loader2 className="animate-spin" />}
          Call protected API
        </Button>
        <Button
          variant="secondary"
          onClick={forceRefresh}
          disabled={calling || refreshing}
        >
          {refreshing && <Loader2 className="animate-spin" />}
          Force refresh (rotate)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>
            Watch rotation and silent refresh happen in real time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-1 font-mono text-sm">
              {log.map((line, i) => (
                <li key={i} className="text-muted-foreground">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Tip: open DevTools → Application → Cookies. You’ll see{" "}
        <code>access_token</code> and <code>refresh_token</code> marked{" "}
        <strong>HttpOnly</strong>. Run <code>document.cookie</code> in the
        console — they won’t appear. That’s the XSS protection.
      </p>
    </main>
  );
}
