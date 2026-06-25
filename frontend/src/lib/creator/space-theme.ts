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

/** HSL components for CSS vars: `165 76% 48%` (no hsl() wrapper). */
export function hexToHslComponents(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      default:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export type StudentThemeCssVars = {
  "--primary": string;
  "--primary-foreground": string;
  "--accent": string;
  "--accent-foreground": string;
  "--ring": string;
  "--glow-accent": string;
  "--student-glow": string;
};

/** Theme tokens for the student app shell — inherits to all bg-primary / hsl(var(--primary)). */
export function buildStudentThemeCssVars(
  primaryColor: string | null | undefined,
): StudentThemeCssVars {
  const accent = normalizeAccentColor(primaryColor);
  const primary = hexToHslComponents(accent);
  const primaryForeground = hexToHslComponents(foregroundOnAccent(accent));
  const hue = primary.split(" ")[0] ?? "165";

  return {
    "--primary": primary,
    "--primary-foreground": primaryForeground,
    "--accent": primary,
    "--accent-foreground": primaryForeground,
    "--ring": primary,
    "--glow-accent": primary,
    "--student-glow": `${hue} 40% 12%`,
  };
}
