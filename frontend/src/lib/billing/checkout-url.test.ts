import { describe, expect, it } from "vitest";
import { isAllowedCheckoutUrl, redirectToCheckout } from "@/lib/billing/checkout-url";

describe("checkout-url", () => {
  it("allows Asaas HTTPS checkout URLs", () => {
    expect(isAllowedCheckoutUrl("https://www.asaas.com/checkout/show/abc")).toBe(true);
    expect(isAllowedCheckoutUrl("https://sandbox.asaas.com/c/xyz")).toBe(true);
  });

  it("rejects non-HTTPS and unknown hosts", () => {
    expect(isAllowedCheckoutUrl("http://www.asaas.com/x")).toBe(false);
    expect(isAllowedCheckoutUrl("https://evil.example/phish")).toBe(false);
    expect(isAllowedCheckoutUrl("javascript:alert(1)")).toBe(false);
  });

  it("redirectToCheckout returns false for invalid URLs", () => {
    expect(redirectToCheckout("https://evil.example/x")).toBe(false);
  });
});
