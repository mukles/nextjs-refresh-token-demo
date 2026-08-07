"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

const renderLinks = [
  { href: "/dashboard", label: "Client rendering" },
  { href: "/dashboard/server", label: "Server rendering" },
  { href: "/dashboard/server-slow", label: "Slow SSR test" },
  { href: "/dashboard/settings", label: "Profile settings" },
];

function NavigationLinkLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();

  return (
    <span className="inline-flex items-center gap-1.5">
      <Loader2
        aria-hidden="true"
        className={cn(
          "size-3.5 shrink-0",
          pending ? "animate-spin opacity-100" : "opacity-0",
        )}
      />
      <span>{label}</span>
      {pending && <span className="sr-only">Loading</span>}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isLoading, isRefreshing, rotateTokens, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-4 px-6 py-3">
        <Link
          className="mr-auto font-semibold tracking-tight"
          href="/dashboard"
        >
          Next.js Auth Lab
        </Link>

        <nav
          aria-label="Rendering examples"
          className="flex items-center gap-1"
        >
          {renderLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                <NavigationLinkLabel label={link.label} />
              </Link>
            );
          })}
        </nav>

        <div className="hidden text-right text-xs sm:block">
          <p className="font-medium">
            {isLoading ? "Checking session…" : user?.name}
          </p>
          {user && <p className="text-muted-foreground">{user.mobile}</p>}
        </div>

        <Button
          variant="outline"
          size="icon"
          title="Rotate refresh token"
          aria-label="Rotate refresh token"
          disabled={isLoading || isRefreshing}
          onClick={() => void rotateTokens()}
        >
          {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        </Button>
        <Button
          variant="outline"
          onClick={() => void logout()}
          disabled={isLoading}
        >
          <LogOut />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
