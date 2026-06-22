import { API_PREFIX } from "@/lib/auth/constants";
import {
  clearAuthStorage,
  persistAuth,
  readStoredRefreshToken,
  readStoredToken,
} from "@/lib/auth/storage";
import type {
  ApiErrorBody,
  AuthResponse,
  PaymentRequiredHandler,
  UnauthorizedHandler,
} from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";

const baseUrl = () => (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

let refreshPromise: Promise<boolean> | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;
let onPaymentRequired: PaymentRequiredHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export function setPaymentRequiredHandler(handler: PaymentRequiredHandler | null) {
  onPaymentRequired = handler;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as ApiErrorBody).message;
    if (message) return message;
  }
  return fallback;
}

async function rawRequest(
  method: string,
  path: string,
  body?: unknown,
  withAuth = false,
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = readStoredToken();
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = readStoredRefreshToken();
  if (!refreshToken) return false;

  const res = await rawRequest("POST", `${API_PREFIX}/auth/refresh`, { refreshToken }, false);
  if (!res.ok) return false;

  const data = (await parseBody(res)) as AuthResponse;
  persistAuth(data);
  return true;
}

async function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function handleAuthFailure() {
  clearAuthStorage();
  onUnauthorized?.();
}

function handlePaymentRequired(data: unknown) {
  const message = errorMessage(data, "Sua assinatura precisa de atenção.");
  onPaymentRequired?.(message);
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  withAuth = true,
): Promise<T> {
  let res = await rawRequest(method, path, body, withAuth);

  if (res.status === 401 && withAuth) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      res = await rawRequest(method, path, body, withAuth);
    } else {
      handleAuthFailure();
      throw new ApiError(401, "Sessão expirada. Faça login novamente.");
    }
  }

  const data = await parseBody(res);

  if (res.status === 402) {
    handlePaymentRequired(data);
    throw new ApiError(402, errorMessage(data, "Assinatura necessária."), data as ApiErrorBody);
  }

  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(data, `Erro ${res.status}`), data as ApiErrorBody);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => apiRequest<T>("PUT", path, body),
  delete: <T>(path: string) => apiRequest<T>("DELETE", path),
};

export async function apiRequestPublic<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await rawRequest(method, path, body, false);
  const data = await parseBody(res);
  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(data, `Erro ${res.status}`), data as ApiErrorBody);
  }
  return data as T;
}

export function getApiBaseUrl(): string {
  return baseUrl();
}
