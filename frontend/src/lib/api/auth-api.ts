import { apiRequestPublic, api } from "@/lib/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/lib/api/types";
import { API_PREFIX } from "@/lib/auth/constants";
import { persistAuth, readStoredRefreshToken } from "@/lib/auth/storage";
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const auth = await apiRequestPublic<AuthResponse>("POST", `${API_PREFIX}/auth/login`, credentials);
  persistAuth(auth);
  return auth;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const auth = await apiRequestPublic<AuthResponse>("POST", `${API_PREFIX}/auth/register`, payload);
  persistAuth(auth);
  return auth;
}

export async function fetchCurrentUser(): Promise<User> {
  return api.get<User>(`${API_PREFIX}/auth/me`);
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequestPublic<{ message: string }>("POST", `${API_PREFIX}/auth/forgot-password`, {
    email,
  });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiRequestPublic<{ message: string }>("POST", `${API_PREFIX}/auth/reset-password`, {
    token,
    password,
  });
}

export async function refreshSession(): Promise<AuthResponse | null> {
  const refreshToken = readStoredRefreshToken();
  if (!refreshToken) return null;
  const auth = await apiRequestPublic<AuthResponse>("POST", `${API_PREFIX}/auth/refresh`, {
    refreshToken,
  });
  persistAuth(auth);
  return auth;
}
