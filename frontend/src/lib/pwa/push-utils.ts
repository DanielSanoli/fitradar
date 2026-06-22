const PUSH_DISMISSED = "fitradar_push_dismissed";
const PUSH_ENABLED = "fitradar_push_enabled";
const INSTALL_DISMISSED = "fitradar_pwa_install_dismissed";

export const pwaStorage = {
  isPushDismissed: () => localStorage.getItem(PUSH_DISMISSED) === "1",
  dismissPush: () => localStorage.setItem(PUSH_DISMISSED, "1"),
  isPushEnabled: () => localStorage.getItem(PUSH_ENABLED) === "1",
  setPushEnabled: (on: boolean) =>
    localStorage.setItem(PUSH_ENABLED, on ? "1" : "0"),
  isInstallDismissed: () => localStorage.getItem(INSTALL_DISMISSED) === "1",
  dismissInstall: () => localStorage.setItem(INSTALL_DISMISSED, "1"),
};

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.ready.catch(() => null);
}

export async function subscribeToPush(publicKey: string): Promise<PushSubscription | null> {
  const reg = await getServiceWorkerRegistration();
  if (!reg?.pushManager) return null;

  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });
}

export function subscriptionToPayload(sub: PushSubscription): {
  endpoint: string;
  p256dh: string;
  auth: string;
} {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint ?? sub.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  };
}

export async function unsubscribePushLocally(): Promise<void> {
  const reg = await getServiceWorkerRegistration();
  const sub = await reg?.pushManager?.getSubscription();
  if (sub) await sub.unsubscribe();
}

/** Re-sincroniza subscription com backend se permissão já concedida. */
export async function resyncPushIfGranted(): Promise<void> {
  if (!pwaStorage.isPushEnabled()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const { pushApi } = await import("@/lib/api/push-api");
    const config = await pushApi.config();
    if (!config.enabled || !config.publicKey) return;
    const sub = await subscribeToPush(config.publicKey);
    if (!sub) return;
    await pushApi.subscribe(subscriptionToPayload(sub));
  } catch {
    /* offline ou push desabilitado no servidor */
  }
}
