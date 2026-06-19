import type { AuthResponse, User } from "@/lib/api/types";
import { AUTH_STORAGE } from "@/lib/auth/constants";

export function readStoredUser(): User | null {
  const raw = localStorage.getItem(AUTH_STORAGE.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function readStoredToken(): string | null {
  return localStorage.getItem(AUTH_STORAGE.token);
}

export function readStoredRefreshToken(): string | null {
  return localStorage.getItem(AUTH_STORAGE.refresh);
}

export function persistAuth(auth: AuthResponse): void {
  localStorage.setItem(AUTH_STORAGE.token, auth.token);
  localStorage.setItem(AUTH_STORAGE.refresh, auth.refreshToken);
  localStorage.setItem(AUTH_STORAGE.user, JSON.stringify(auth.user));
}

export function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE.token);
  localStorage.removeItem(AUTH_STORAGE.refresh);
  localStorage.removeItem(AUTH_STORAGE.user);
}

export function isAuthenticated(): boolean {
  return Boolean(readStoredToken() && readStoredUser());
}
