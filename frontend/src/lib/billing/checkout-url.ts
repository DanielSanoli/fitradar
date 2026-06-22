const ALLOWED_CHECKOUT_HOSTS = ["asaas.com", "sandbox.asaas.com", "www.asaas.com"] as const;

/** Valida URL de checkout Asaas (HTTPS + domínio allowlist). */
export function isAllowedCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_CHECKOUT_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

export function redirectToCheckout(checkoutUrl: string): boolean {
  if (!isAllowedCheckoutUrl(checkoutUrl)) return false;
  window.location.href = checkoutUrl;
  return true;
}
