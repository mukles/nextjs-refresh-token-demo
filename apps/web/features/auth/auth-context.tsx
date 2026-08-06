"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BackendError, backendResultFromResponse } from "@/lib/backend";
import {
  backendFetch,
  backendFetchWithAutoRefresh,
} from "@/lib/backend-client";

export type AuthUser = {
  id: string;
  name: string;
  mobile: string;
};

type MeResponse = {
  user: AuthUser;
  accessTokenExpiresAt: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessTokenExpiresAt: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refreshUser: () => Promise<{ ok: boolean; didRefresh: boolean }>;
  rotateTokens: () => Promise<boolean>;
  handleAuthFailure: (error: BackendError) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAuthFailure = useCallback(
    (error: BackendError) => {
      if (error.code === "REUSE_DETECTED") {
        toast.error("Token reuse detected — session revoked. Logging out.");
      } else {
        toast.error(error.message);
      }

      setUser(null);
      setAccessTokenExpiresAt(null);
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    },
    [pathname, router],
  );

  const refreshUser = useCallback(async () => {
    const { res, didRefresh } = await backendFetchWithAutoRefresh("/auth/me");
    const result = await backendResultFromResponse<MeResponse>(
      res,
      "Session expired. Please log in again.",
    );
    if (!result.ok) {
      handleAuthFailure(result.error);
      return { ok: false, didRefresh: false };
    }

    setUser(result.data.user);
    setAccessTokenExpiresAt(result.data.accessTokenExpiresAt);
    return { ok: true, didRefresh };
  }, [handleAuthFailure]);

  const rotateTokens = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await backendFetch("/auth/refresh", { method: "POST" });
      if (!response.ok) {
        const result = await backendResultFromResponse<unknown>(response);
        if (!result.ok) handleAuthFailure(result.error);
        return false;
      }

      const session = await refreshUser();
      if (!session.ok) return false;
      toast.success("Refreshed — refresh-token value rotated");
      return true;
    } catch {
      toast.error("Backend API is unavailable");
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [handleAuthFailure, refreshUser]);

  const logout = useCallback(async () => {
    try {
      await backendFetch("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setAccessTokenExpiresAt(null);
      toast.success("Logged out");
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register") {
      Promise.resolve().then(() => setIsLoading(false));
      return;
    }
    // The provider synchronizes its state with the protected backend session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser().finally(() => setIsLoading(false));
  }, [pathname, refreshUser]);

  const value = useMemo(
    () => ({
      user,
      accessTokenExpiresAt,
      isLoading,
      isRefreshing,
      refreshUser,
      rotateTokens,
      handleAuthFailure,
      logout,
    }),
    [
      user,
      accessTokenExpiresAt,
      isLoading,
      isRefreshing,
      refreshUser,
      rotateTokens,
      handleAuthFailure,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
