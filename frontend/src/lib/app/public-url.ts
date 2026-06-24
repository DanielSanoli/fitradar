/** Public site base URL for shareable links (deploy: VITE_PUBLIC_BASE_URL). */
export function getPublicBaseUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function buildCreatorSpaceUrl(slug: string): string {
  const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug) return getPublicBaseUrl();
  return `${getPublicBaseUrl()}/c/${encodeURIComponent(cleanSlug)}`;
}

/** Compact display without protocol — matches creator UI prototypes. */
export function formatCreatorSpaceLinkDisplay(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
