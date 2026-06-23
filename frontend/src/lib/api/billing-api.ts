import { api } from "@/lib/api/client";
import { API_PREFIX } from "@/lib/auth/constants";

export type CheckoutResponse = {
  checkoutUrl?: string | null;
  message?: string | null;
};

export const billingApi = {
  checkoutPro: () => api.post<CheckoutResponse>(`${API_PREFIX}/billing/checkout/pro`),
};
