import type { AuthResponse, User } from "@/lib/api/types";
import { AUTH_STORAGE } from "@/lib/auth/constants";

let accessToken: string | null = null;
let cachedUser: User | null = null;

/** Remove tokens legados de localStorage (migração). */
function clearLegacyTokenStorage(): void {
  localStorage.removeItem(AUTH_STORAGE.token);
  localStorage.removeItem(AUTH_STORAGE.refresh);
  localStorage.removeItem(AUTH_STORAGE.user);
}

clearLegacyTokenStorage();

export function getAccessToken(): string | null {
  return accessToken;
}

export function hasAccessToken(): boolean {
  return Boolean(accessToken);
}

export function readStoredUser(): User | null {
  return cachedUser;
}

export function persistAuth(auth: AuthResponse): void {
  accessToken = auth.token;
  cachedUser = auth.user;
  clearLegacyTokenStorage();
}

export function persistUser(user: User): void {
  cachedUser = user;
}

export function clearAuthStorage(): void {
  accessToken = null;
  cachedUser = null;
  clearLegacyTokenStorage();
}

export function isAuthenticated(): boolean {
  return hasAccessToken();
}
