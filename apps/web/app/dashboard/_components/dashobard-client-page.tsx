"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, MapPin, School, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  backendFetch,
  backendFetchWithAutoRefresh,
} from "@/lib/backend-client";
import type { StudentProfile } from "@/lib/student-profile";

type Me = { id: string; name: string; mobile: string };
type MeResponse = {
  user: Me;
  accessTokenExpiresAt: string | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatCountdown(value: string | null, now: number): string {
  if (!value) return "Unavailable";

  const expiresAt = new Date(value).getTime();
  const secondsRemaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  if (secondsRemaining === 0) return "Expired";
  if (minutes === 0) return `${seconds}s left`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s left`;
}

async function internalFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return backendFetch(path, init);
}

function ProfileCard({ profile }: { profile: StudentProfile }) {
  const trialBadgeColor =
    profile.trial?.status === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Student Profile
        </CardTitle>
        <CardDescription>Fetched from /api/v1/students/profile</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {profile.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-base">{profile.name}</p>
            <p className="text-sm text-muted-foreground">
              {profile.mobileNumber}
            </p>
            {profile.trial && (
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${trialBadgeColor}`}
              >
                Trial: {profile.trial.status}
              </span>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          {profile.activeClass && (
            <div className="flex items-start gap-2 rounded-md border p-3">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Active Class</p>
                <p className="text-muted-foreground">
                  {profile.activeClass.name}
                </p>
              </div>
            </div>
          )}
          {profile.institution && (
            <div className="flex items-start gap-2 rounded-md border p-3">
              <School className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Institution</p>
                <p className="text-muted-foreground">
                  {profile.institution.institutionShortName}
                </p>
              </div>
            </div>
          )}
          {profile.address?.district && (
            <div className="flex items-start gap-2 rounded-md border p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">District</p>
                <p className="text-muted-foreground">
                  {profile.address.district}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 rounded-md border p-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Gender</p>
              <p className="text-muted-foreground">{profile.gender}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<
    string | null
  >(null);
  const [now, setNow] = useState(() => Date.now());
  const [log, setLog] = useState<string[]>([]);
  const [calling, setCalling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const addLog = useCallback((line: string) => {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => [`${time} — ${line}`, ...prev].slice(0, 12));
  }, []);

  const handleAuthFailure = useCallback(
    async (res: Response) => {
      const data = await res.json().catch(() => ({}));
      if ((data as { code?: string }).code === "REUSE_DETECTED") {
        toast.error("🚨 Token reuse detected — session revoked. Logging out.");
      } else {
        toast.error(
          (data as { error?: string }).error ??
            "Session expired. Please log in again.",
        );
      }
      router.push("/login");
    },
    [router],
  );

  const fetchProfile = useCallback(async () => {
    const { res, didRefresh } =
      await backendFetchWithAutoRefresh("/students/profile");
    if (!res.ok) return handleAuthFailure(res);
    const data = (await res.json()) as StudentProfile;
    setProfile(data);
    if (didRefresh) addLog("Profile fetched after silent token refresh ✅");
  }, [addLog, handleAuthFailure]);

  const callProtected = useCallback(async () => {
    setCalling(true);
    try {
      const { res, didRefresh } = await backendFetchWithAutoRefresh("/auth/me");
      if (!res.ok) return handleAuthFailure(res);

      const data = (await res.json()) as MeResponse;
      setUser(data.user);
      setAccessTokenExpiresAt(data.accessTokenExpiresAt);
      if (didRefresh) {
        addLog(
          "Access token was expired → silently refreshed, then retried ✅",
        );
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
      const res = await internalFetch("/auth/refresh", { method: "POST" });
      if (!res.ok) return handleAuthFailure(res);
      addLog("Forced backend /auth/refresh → refresh token ROTATED 🔁");
      toast.success("Refreshed — refresh-token value rotated");
      await callProtected();
    } finally {
      setRefreshing(false);
    }
  }, [addLog, handleAuthFailure, callProtected]);

  const logout = useCallback(async () => {
    await internalFetch("/auth/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/login");
  }, [router]);

  useEffect(() => {
    void (async () => {
      await callProtected();
      await fetchProfile();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {user ? `Signed in as ${user.name} (${user.mobile})` : "Loading…"}
          </p>
          <p className="text-sm text-muted-foreground">
            Access token expires: {formatDateTime(accessTokenExpiresAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            Countdown: {formatCountdown(accessTokenExpiresAt, now)}
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      {/* Profile section */}
      {profile ? (
        <ProfileCard profile={profile} />
      ) : (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading profile…
          </CardContent>
        </Card>
      )}

      {/* Actions */}
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

      {/* Activity log */}
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
        Tip: open DevTools → Application → Cookies. You will see{" "}
        <code>{ACCESS_COOKIE}</code> and <code>{REFRESH_COOKIE}</code> marked{" "}
        <strong>HttpOnly</strong>. Run <code>document.cookie</code> in the
        console — they will not appear. That is the XSS protection.
      </p>
    </main>
  );
}
