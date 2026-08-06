"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  Loader2,
  Server,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";

const stats = [
  {
    label: "Session status",
    value: "Active",
    detail: "Protected and authenticated",
    icon: ShieldCheck,
    iconClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "API connection",
    value: "Healthy",
    detail: "Backend is responding",
    icon: Activity,
    iconClass: "bg-sky-50 text-sky-700",
  },
  {
    label: "Token strategy",
    value: "Rotating",
    detail: "Refresh tokens are secured",
    icon: KeyRound,
    iconClass: "bg-violet-50 text-violet-700",
  },
];

const activity = [
  { label: "Session verified", detail: "Access token accepted", time: "Now" },
  {
    label: "Profile synchronized",
    detail: "Account details are up to date",
    time: "Recently",
  },
  {
    label: "Secure login completed",
    detail: "Authentication flow finished",
    time: "Today",
  },
];

export function DashboardOverview() {
  const { user, isLoading } = useAuth();
  const firstName = user?.name.trim().split(/\s+/)[0] || "there";

  return (
    <main className="flex-1 bg-muted/30">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-8 sm:py-10">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              Overview
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {isLoading ? "Welcome back" : `Welcome back, ${firstName}`}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Your account and authentication services are working as expected.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit bg-background">
            <Link href="/dashboard/settings">
              Manage profile
              <ArrowUpRight />
            </Link>
          </Button>
        </section>

        <section
          aria-label="Account summary"
          className="grid gap-4 md:grid-cols-3"
        >
          {stats.map(({ label, value, detail, icon: Icon, iconClass }) => (
            <Card key={label}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                </div>
                <span className={`rounded-lg p-2.5 ${iconClass}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>
                The latest events from your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {activity.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Common account destinations.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button
                asChild
                variant="outline"
                className="h-auto justify-start gap-3 px-3 py-3"
              >
                <Link href="/dashboard/settings">
                  <span className="rounded-md bg-muted p-2">
                    <UserRound className="size-4" />
                  </span>
                  <span className="text-left">
                    <span className="block font-medium">Profile settings</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      Update your information
                    </span>
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto justify-start gap-3 px-3 py-3"
              >
                <Link href="/dashboard/server">
                  <span className="rounded-md bg-muted p-2">
                    <Server className="size-4" />
                  </span>
                  <span className="text-left">
                    <span className="block font-medium">Server profile</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      View server-rendered data
                    </span>
                  </span>
                </Link>
              </Button>
              {isLoading && (
                <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Syncing your
                  session…
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
