import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchCurrentUser, login as loginRequest, logoutSession, register as registerRequest } from "@/lib/api/auth-api";
import { setPaymentRequiredHandler, setUnauthorizedHandler } from "@/lib/api/client";
import type { LoginRequest, RegisterRequest, User } from "@/lib/api/types";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";
import {
  clearAuthStorage,
  isAuthenticated,
  persistAuth,
  readStoredUser,
} from "@/lib/auth/storage";
import { AUTH_STORAGE } from "@/lib/auth/constants";
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
  const location = useLocation();  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(() => isAuthenticated());

  const logout = useCallback(async () => {
    await logoutSession();
    clearAuthStorage();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      return;
    }
    const me = await fetchCurrentUser();
    setUser(me);
    const token = localStorage.getItem(AUTH_STORAGE.token);
    const refresh = localStorage.getItem(AUTH_STORAGE.refresh);
    if (token && refresh) {
      persistAuth({ token, refreshToken: refresh, tokenType: "Bearer", user: me });
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    setPaymentRequiredHandler((message) => {
      navigate("/billing-required", { replace: true, state: { message } });
    });
    return () => {
      setUnauthorizedHandler(null);
      setPaymentRequiredHandler(null);
    };
  }, [logout, navigate]);

  useEffect(() => {
    if (!isAuthenticated()) {
      setIsLoading(false);
      return;
    }
    refreshUser()
      .catch(() => logout())
      .finally(() => {
        setIsLoading(false);
        const u = readStoredUser();
        if (u?.role === "STUDENT") void resyncPushIfGranted();
      });
  }, [logout, refreshUser]);

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
