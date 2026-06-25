import { beforeEach, describe, expect, it, vi } from "vitest";
import { memberApi } from "@/lib/api/member-api";
import { ApiError } from "@/lib/api/types";
import { redirectToCheckout } from "@/lib/billing/checkout-url";
import { startProgramCheckout } from "@/lib/billing/start-program-checkout";

vi.mock("@/lib/api/member-api", () => ({
  memberApi: {
    checkoutProgram: vi.fn(),
  },
}));

vi.mock("@/lib/billing/checkout-url", () => ({
  redirectToCheckout: vi.fn(),
}));

describe("startProgramCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(redirectToCheckout).mockReturnValue(true);
  });

  it("redirects when checkout URL is present", async () => {
    vi.mocked(memberApi.checkoutProgram).mockResolvedValue({
      purchaseId: "pur-1",
      checkoutUrl: "https://sandbox.asaas.com/checkout/abc",
      amount: "99.00",
      platformFee: "9.90",
      creatorNet: "89.10",
      message: null,
    });

    const result = await startProgramCheckout("p1");

    expect(result).toEqual({ ok: true, redirected: true });
    expect(redirectToCheckout).toHaveBeenCalledWith("https://sandbox.asaas.com/checkout/abc");
  });

  it("returns message when checkout URL is absent", async () => {
    vi.mocked(memberApi.checkoutProgram).mockResolvedValue({
      purchaseId: "pur-2",
      checkoutUrl: null,
      amount: "99.00",
      platformFee: "9.90",
      creatorNet: "89.10",
      message: "Pagamento simulado.",
    });

    const result = await startProgramCheckout("p2");

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Pagamento simulado.");
    expect(redirectToCheckout).not.toHaveBeenCalled();
  });

  it("surfaces API errors", async () => {
    vi.mocked(memberApi.checkoutProgram).mockRejectedValue(new ApiError(400, "Criador sem wallet."));

    const result = await startProgramCheckout("p3");

    expect(result).toEqual({ ok: false, error: "Criador sem wallet." });
  });
});
