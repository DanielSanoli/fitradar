export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

const LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

export function isAllowedLogoFile(file: File): boolean {
  if (LOGO_MIME_TYPES.has(file.type)) return true;
  return /\.(png|jpe?g|webp|svg)$/i.test(file.name);
}

export function persistableLogoUrl(logoUrl: string): string | null {
  const url = logoUrl.trim();
  if (!url) return null;
  if (url.startsWith("/uploads/logos/") && url.length <= 500) return url;
  if ((url.startsWith("http://") || url.startsWith("https://")) && url.length <= 500) return url;
  return null;
}
