export const SPACE_SWATCHES = [
  "#1ed7a6",
  "#5b8cff",
  "#b07cff",
  "#ff7a59",
  "#ffc24b",
  "#ff5d8f",
] as const;

export const PROGRAM_DURATIONS = [
  { weeks: "4", label: "4 semanas" },
  { weeks: "8", label: "8 semanas" },
  { weeks: "12", label: "12 semanas" },
  { weeks: "0", label: "Contínuo" },
] as const;

export function hexToRgb(hex: string): [number, number, number] {
  let normalized = (hex || "#1ed7a6").replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(normalized, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbaHex(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function foregroundOnAccent(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0b1712" : "#ffffff";
}

export function slugifySpaceName(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "e")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function spaceInitials(name: string): string {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "FR";
  return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
}

export function normalizeAccentColor(color: string | null | undefined): string {
  if (!color?.trim()) return SPACE_SWATCHES[0];
  const c = color.trim();
  if (c.startsWith("#")) return c;
  return SPACE_SWATCHES[0];
}
