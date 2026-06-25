import { memberApi } from "@/lib/api/member-api";
import { redirectToCheckout } from "@/lib/billing/checkout-url";
import { ApiError } from "@/lib/api/types";

export async function startProgramCheckout(
  programId: string,
): Promise<{ ok: boolean; error?: string; message?: string; redirected?: boolean }> {
  try {
    const response = await memberApi.checkoutProgram(programId);
    if (response.checkoutUrl) {
      if (!redirectToCheckout(response.checkoutUrl)) {
        return {
          ok: false,
          error: "URL de checkout inválida. Entre em contato com o suporte.",
        };
      }
      return { ok: true, redirected: true };
    }
    return {
      ok: true,
      message: response.message ?? "Compra registrada — aguarde a confirmação do pagamento.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ApiError ? err.message : "Erro ao iniciar checkout.",
    };
  }
}
