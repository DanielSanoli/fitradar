import { api } from "@/lib/api/client";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/api/types";
import { API_PREFIX } from "@/lib/auth/constants";

export type CheckoutResponse = {
  plan?: SubscriptionPlan;
  checkoutUrl?: string | null;
  message?: string | null;
};

export type SubscriptionDetailsResponse = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  subscriptionEndsAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  asaasConfigured: boolean;
  canCancel: boolean;
  canReactivate: boolean;
  message: string | null;
};

export type SubscriptionInvoiceResponse = {
  id: string;
  status: string;
  value: string;
  dueDate: string | null;
  paymentDate: string | null;
  invoiceUrl: string | null;
};

export type MessageResponse = {
  message: string;
};

export const billingApi = {
  checkoutPro: () => api.post<CheckoutResponse>(`${API_PREFIX}/billing/checkout/pro`),

  subscriptionDetails: () =>
    api.get<SubscriptionDetailsResponse>(`${API_PREFIX}/billing/subscription`),

  subscriptionInvoices: () =>
    api.get<SubscriptionInvoiceResponse[]>(`${API_PREFIX}/billing/subscription/invoices`),

  cancelSubscription: () =>
    api.delete<MessageResponse>(`${API_PREFIX}/billing/subscription`),

  reactivateSubscription: () =>
    api.post<CheckoutResponse>(`${API_PREFIX}/billing/subscription/reactivate`),
};
