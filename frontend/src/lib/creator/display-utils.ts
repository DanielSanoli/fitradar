import type { RiskLevel, UiRiskLevel } from "@/lib/api/domain-types";
import { riskLevelToUi } from "@/lib/api/domain-types";

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Bar/label color from adherence DTO string (display only — value comes from backend). */
export function adherenceBarColor(adherence: string | null | undefined): string {
  if (adherence == null || adherence === "") return "hsl(215 14% 44%)";
  const parsed = parseFloat(adherence);
  if (!Number.isFinite(parsed) || parsed <= 0) return "hsl(215 14% 44%)";
  if (parsed >= 75) return "hsl(165 76% 48%)";
  if (parsed >= 50) return "hsl(38 96% 56%)";
  return "hsl(0 72% 67%)";
}

export function adherenceBarWidth(adherence: string | null | undefined): string {
  if (adherence == null || adherence === "") return "0%";
  const parsed = parseFloat(adherence);
  if (!Number.isFinite(parsed) || parsed <= 0) return "0%";
  return `${Math.min(100, Math.max(0, parsed))}%`;
}

export function formatAdherenceDisplay(adherence: string | null | undefined): string {
  if (adherence == null || adherence === "") return "—";
  const parsed = parseFloat(adherence);
  if (!Number.isFinite(parsed) || parsed <= 0) return "—";
  return `${adherence}%`;
}

export function parseInactiveDays(assumptions: string[] | undefined): number | null {
  if (!assumptions?.length) return null;
  for (const line of assumptions) {
    const inactive = line.match(/Inativo há (\d+) dia/i);
    if (inactive) return parseInt(inactive[1], 10);
    const since = line.match(/Sem nenhum check-in há (\d+) dia/i);
    if (since) return parseInt(since[1], 10);
  }
  return null;
}

export function formatLastActivity(
  inactiveDays: number | null,
  hasCheckIns: boolean,
): { label: string; colorClass: string } {
  if (!hasCheckIns) return { label: "nunca", colorClass: "text-muted-foreground" };
  if (inactiveDays == null) return { label: "recente", colorClass: "text-foreground" };
  if (inactiveDays === 0) return { label: "hoje", colorClass: "text-primary" };
  if (inactiveDays === 1) return { label: "ontem", colorClass: "text-foreground/90" };
  if (inactiveDays >= 7) return { label: `há ${inactiveDays} dias`, colorClass: "text-destructive" };
  return { label: `há ${inactiveDays} dias`, colorClass: "text-amber-400" };
}

export function daysSince(isoDate: string): number {
  const created = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function formatJoinedStr(isoDate: string): string {
  const days = daysSince(isoDate);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

export function inactiveDisplayValue(inactiveDays: number | null): {
  value: string;
  unit: string;
  color: string;
} {
  if (inactiveDays == null) {
    return { value: "—", unit: "", color: "hsl(var(--foreground))" };
  }
  if (inactiveDays === 0) {
    return { value: "hoje", unit: "", color: "hsl(165 76% 48%)" };
  }
  const color =
    inactiveDays <= 2
      ? "hsl(var(--foreground))"
      : inactiveDays >= 7
        ? "hsl(0 72% 67%)"
        : "hsl(38 96% 56%)";
  return {
    value: String(inactiveDays),
    unit: inactiveDays === 1 ? "dia" : "dias",
    color,
  };
}

export function streakSubtitle(streak: number): string {
  if (streak >= 7) return "Sequência excelente";
  if (streak >= 3) return "Mantendo o ritmo";
  if (streak === 0) return "Sequência interrompida";
  return "Recomeçando";
}

export function isHighRisk(level: RiskLevel | undefined): boolean {
  return level === "MEDIUM" || level === "HIGH";
}

export function riskUi(level: RiskLevel | undefined): UiRiskLevel | null {
  if (!level) return null;
  return riskLevelToUi(level);
}

export const PROGRAM_ACCENT_BARS = [
  "linear-gradient(90deg, hsl(165 76% 48%), hsl(165 70% 62%))",
  "linear-gradient(90deg, hsl(258 80% 64%), hsl(258 70% 74%))",
  "linear-gradient(90deg, hsl(38 100% 56%), hsl(38 90% 68%))",
] as const;
