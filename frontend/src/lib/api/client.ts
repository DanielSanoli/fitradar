import { API_PREFIX } from "@/lib/auth/constants";
import { FREE_LIMIT_MESSAGE_SNIPPET } from "@/lib/billing/pro-upgrade-prompt";
import {
  clearAuthStorage,
  getAccessToken,
  hasAccessToken,
  persistAuth,
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

const ACCESS_REFRESH_BUFFER_MS = 2 * 60 * 1000;
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null;

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
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = `${baseUrl()}${path}`;
  try {
    return await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const hint = baseUrl()
      ? `Verifique se a API está rodando em ${baseUrl()}.`
      : "Verifique se a API está rodando em http://localhost:8080 (docker compose up).";
    throw new ApiError(0, `Não foi possível conectar à API. ${hint}`);
  }
}

function readAccessTokenExpiryMs(): number | null {
  const token = getAccessToken();
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function scheduleProactiveAccessRefresh() {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
  if (!hasAccessToken()) return;

  const expMs = readAccessTokenExpiryMs();
  if (!expMs) return;

  const delay = Math.max(5_000, expMs - Date.now() - ACCESS_REFRESH_BUFFER_MS);
  proactiveRefreshTimer = setTimeout(() => {
    proactiveRefreshTimer = null;
    void refreshOnce().then((ok) => {
      if (ok) scheduleProactiveAccessRefresh();
    });
  }, delay);
}

export function startProactiveAccessTokenRefresh(): () => void {
  scheduleProactiveAccessRefresh();

  const onVisibility = () => {
    if (document.visibilityState !== "visible") return;
    const expMs = readAccessTokenExpiryMs();
    if (expMs && Date.now() >= expMs - ACCESS_REFRESH_BUFFER_MS) {
      void refreshOnce().then((ok) => {
        if (ok) scheduleProactiveAccessRefresh();
      });
      return;
    }
    scheduleProactiveAccessRefresh();
  };

  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    if (proactiveRefreshTimer) {
      clearTimeout(proactiveRefreshTimer);
      proactiveRefreshTimer = null;
    }
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

async function tryRefresh(): Promise<boolean> {
  const res = await rawRequest("POST", `${API_PREFIX}/auth/refresh`, undefined, false);
  if (!res.ok) return false;

  const data = (await parseBody(res)) as AuthResponse;
  persistAuth(data);
  scheduleProactiveAccessRefresh();
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

function maybePromptProUpgrade(data: unknown) {
  const message = errorMessage(data, "");
  if (
    message.includes("Recurso disponível no plano Pro")
    || message.includes(FREE_LIMIT_MESSAGE_SNIPPET)
  ) {
    onPaymentRequired?.(message);
  }
}

export async function apiUpload<T>(path: string, formData: FormData, withAuth = true): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const token = getAccessToken();
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = `${baseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
  } catch {
    const hint = baseUrl()
      ? `Verifique se a API está rodando em ${baseUrl()}.`
      : "Verifique se a API está rodando em http://localhost:8080 (docker compose up).";
    throw new ApiError(0, `Não foi possível conectar à API. ${hint}`);
  }

  if (res.status === 401 && withAuth) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return apiUpload<T>(path, formData, withAuth);
    }
    handleAuthFailure();
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }

  const data = await parseBody(res);

  if (res.status === 402) {
    maybePromptProUpgrade(data);
    throw new ApiError(402, errorMessage(data, "Assinatura necessária."), data as ApiErrorBody);
  }

  if (!res.ok) {
    maybePromptProUpgrade(data);
    throw new ApiError(res.status, errorMessage(data, `Erro ${res.status}`), data as ApiErrorBody);
  }

  return data as T;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  withAuth = true,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  let res = await rawRequest(method, path, body, withAuth, extraHeaders);

  if (res.status === 401 && withAuth) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      res = await rawRequest(method, path, body, withAuth, extraHeaders);
    } else {
      handleAuthFailure();
      throw new ApiError(401, "Sessão expirada. Faça login novamente.");
    }
  }

  const data = await parseBody(res);

  if (res.status === 402) {
    maybePromptProUpgrade(data);
    throw new ApiError(402, errorMessage(data, "Assinatura necessária."), data as ApiErrorBody);
  }

  if (!res.ok) {
    maybePromptProUpgrade(data);
    throw new ApiError(res.status, errorMessage(data, `Erro ${res.status}`), data as ApiErrorBody);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => apiRequest<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>("PATCH", path, body),
  delete: <T>(path: string) => apiRequest<T>("DELETE", path),
};

export async function apiFetchBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let res = await fetch(`${baseUrl()}${path}`, {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (res.status === 401) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${getAccessToken()}` };
      res = await fetch(`${baseUrl()}${path}`, {
        method: "GET",
        headers: retryHeaders,
        credentials: "include",
      });
    } else {
      handleAuthFailure();
      throw new ApiError(401, "Sessão expirada. Faça login novamente.");
    }
  }
  if (!res.ok) {
    const data = await parseBody(res);
    throw new ApiError(res.status, errorMessage(data, `Erro ${res.status}`), data as ApiErrorBody);
  }
  return res.blob();
}

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
