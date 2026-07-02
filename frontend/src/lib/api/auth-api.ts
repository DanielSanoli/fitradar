import { apiRequestPublic, api, apiRequest } from "@/lib/api/client";
import type { AuthResponse, LoginRequest, RegisterRequest, User, UserSession } from "@/lib/api/types";
import { API_PREFIX } from "@/lib/auth/constants";
import { getAccessToken, persistAuth } from "@/lib/auth/storage";
import { ApiError } from "@/lib/api/types";

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

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const encoded = encodeURIComponent(token);
  return apiRequestPublic<{ message: string }>(
    "GET",
    `${API_PREFIX}/auth/verify-email?token=${encoded}`,
  );
}

export async function resendVerificationEmail(): Promise<{ message: string }> {
  return api.post<{ message: string }>(`${API_PREFIX}/auth/resend-verification`);
}

export type UpdateProfileRequest = {
  name: string;
  email: string;
};

export type ChangePasswordRequest = {
  currentPassword?: string | null;
  newPassword: string;
};

export async function updateProfile(body: UpdateProfileRequest): Promise<User> {
  return api.patch<User>(`${API_PREFIX}/auth/profile`, body);
}

export async function changePassword(body: ChangePasswordRequest): Promise<{ message: string }> {
  return api.post<{ message: string }>(`${API_PREFIX}/auth/change-password`, body);
}

export async function acceptTerms(acceptedTerms: boolean): Promise<{ message: string }> {
  return api.post<{ message: string }>(`${API_PREFIX}/auth/accept-terms`, { acceptedTerms });
}

export async function deleteMyAccount(confirmEmail: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("DELETE", `${API_PREFIX}/auth/me`, { confirmEmail });
}

export async function downloadMyDataExport(): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }

  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const url = `${base}${API_PREFIX}/auth/me/export`;
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "fitradar-meus-dados.json";
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function refreshSession(): Promise<AuthResponse | null> {
  try {
    const auth = await apiRequestPublic<AuthResponse>("POST", `${API_PREFIX}/auth/refresh`);
    persistAuth(auth);
    return auth;
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await apiRequestPublic<{ message: string }>("POST", `${API_PREFIX}/auth/logout`);
  } catch {
    // encerra localmente mesmo se a API falhar
  }
}

export async function listSessions(): Promise<UserSession[]> {
  return apiRequest<UserSession[]>("GET", `${API_PREFIX}/auth/sessions`);
}

export async function revokeSession(sessionId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("DELETE", `${API_PREFIX}/auth/sessions/${sessionId}`);
}
