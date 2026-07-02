import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  login as loginRequest,
  logoutSession,
  refreshSession,
  register as registerRequest,
} from "@/lib/api/auth-api";
import { setUnauthorizedHandler, startProactiveAccessTokenRefresh } from "@/lib/api/client";
import type { LoginRequest, RegisterRequest, User } from "@/lib/api/types";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { clearAuthStorage, hasAccessToken, persistUser } from "@/lib/auth/storage";
import { resyncPushIfGranted } from "@/lib/pwa/push-utils";

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void | Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await logoutSession();
    clearAuthStorage();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    if (!hasAccessToken()) {
      const restored = await refreshSession();
      if (!restored) {
        setUser(null);
        return;
      }
      setUser(restored.user);
      return;
    }
    const me = await fetchCurrentUser();
    setUser(me);
    persistUser(me);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!user) return;
    return startProactiveAccessTokenRefresh();
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const restored = await refreshSession();
        if (cancelled) return;
        if (restored) {
          setUser(restored.user);
          if (restored.user.role === "STUDENT") void resyncPushIfGranted();
          return;
        }
        setUser(null);
        clearAuthStorage();
      } catch {
        if (!cancelled) {
          setUser(null);
          clearAuthStorage();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const auth = await loginRequest(credentials);
      setUser(auth.user);
      const from = (location.state as { from?: string } | null)?.from;
      if (auth.user.mustChangePassword) {
        navigate("/change-password", { replace: true, state: from ? { from } : undefined });
        return;
      }
      if (auth.user.termsAccepted === false) {
        navigate("/accept-terms", { replace: true, state: from ? { from } : undefined });
        return;
      }
      if (auth.user.role === "STUDENT" && auth.user.anamneseCompleted !== true) {
        navigate("/anamnese", { replace: true, state: from ? { from } : undefined });
        return;
      }
      if (auth.user.role === "STUDENT") void resyncPushIfGranted();
      navigate(resolvePostLoginRedirect(from, auth.user.role), { replace: true });
    },
    [navigate, location.state],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const auth = await registerRequest(payload);
      setUser(auth.user);
      if (auth.user.role === "STUDENT") void resyncPushIfGranted();
      navigate(resolvePostLoginRedirect(undefined, auth.user.role), { replace: true });
    },
    [navigate],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
