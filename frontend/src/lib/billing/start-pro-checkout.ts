import { billingApi } from "@/lib/api/billing-api";
import type { ProCheckoutRequest } from "@/lib/api/billing-api";
import { ApiError } from "@/lib/api/types";
import { redirectToCheckout } from "@/lib/billing/checkout-url";

export async function startProCheckout(
  body?: ProCheckoutRequest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await billingApi.checkoutPro(body);
    if (response.checkoutUrl) {
      if (!redirectToCheckout(response.checkoutUrl)) {
        return { ok: false, error: "URL de checkout inválida. Entre em contato com o suporte." };
      }
      return { ok: true };
    }
    return { ok: false, error: response.message ?? "Checkout indisponível no momento." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ApiError ? err.message : "Erro ao iniciar checkout",
    };
  }
}
