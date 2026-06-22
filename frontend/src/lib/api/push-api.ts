import { api } from "@/lib/api/client";
import { API_PREFIX } from "@/lib/auth/constants";

export type PushConfig = {
  enabled: boolean;
  publicKey: string | null;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export const pushApi = {
  config: () => api.get<PushConfig>(`${API_PREFIX}/push/config`),
  subscribe: (payload: PushSubscriptionPayload) =>
    api.post<{ message: string }>(`${API_PREFIX}/push/subscribe`, payload),
  unsubscribe: () => api.delete<{ message: string }>(`${API_PREFIX}/push/subscribe`),
  test: () => api.post<{ message: string }>(`${API_PREFIX}/push/test`),
};
