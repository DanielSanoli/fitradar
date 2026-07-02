import type { PushSubscriptionPayload } from "@/lib/api/push-api";

export const PUSH_ENABLE_TIMEOUT_MS = 15_000;

export const PUSH_MESSAGES = {
  serverDisabled: "Push está desligado no servidor (PUSH_ENABLED).",
  permissionDeniedBrowser:
    "Notificações bloqueadas no navegador. Habilite nas permissões do site.",
  permissionDenied: "Permissão negada.",
  subscribeUnsupported:
    "Seu navegador não suporta push aqui (precisa de HTTPS e app instalado).",
  timeout: "Tempo esgotado, tente novamente.",
} as const;

export class PushEnableTimeoutError extends Error {
  constructor() {
    super(PUSH_MESSAGES.timeout);
    this.name = "PushEnableTimeoutError";
  }
}

export function isPushServerAvailable(config: {
  enabled: boolean;
  publicKey: string | null;
}): boolean {
  return config.enabled && Boolean(config.publicKey);
}

export function isPushPermissionDenied(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "denied";
}

export async function withPushTimeout<T>(
  operation: () => Promise<T>,
  ms: number = PUSH_ENABLE_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new PushEnableTimeoutError()), ms);
  });
  try {
    return await Promise.race([operation(), timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

type PushEnableDeps = {
  requestPermission: () => Promise<NotificationPermission>;
  subscribeToPush: (publicKey: string) => Promise<PushSubscription | null>;
  registerSubscription: (payload: PushSubscriptionPayload) => Promise<unknown>;
  subscriptionToPayload: (sub: PushSubscription) => PushSubscriptionPayload;
};

export async function runPushEnableFlow(
  config: { enabled: boolean; publicKey: string | null },
  deps: PushEnableDeps,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isPushServerAvailable(config)) {
    return { ok: false, message: PUSH_MESSAGES.serverDisabled };
  }

  if (isPushPermissionDenied()) {
    return { ok: false, message: PUSH_MESSAGES.permissionDeniedBrowser };
  }

  const permission = await deps.requestPermission();
  if (permission !== "granted") {
    return { ok: false, message: PUSH_MESSAGES.permissionDenied };
  }

  const sub = await deps.subscribeToPush(config.publicKey!);
  if (!sub) {
    return { ok: false, message: PUSH_MESSAGES.subscribeUnsupported };
  }

  await deps.registerSubscription(deps.subscriptionToPayload(sub));
  return { ok: true };
}
