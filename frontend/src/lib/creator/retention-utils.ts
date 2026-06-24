import type { ChurnRiskResult, RiskLevel } from "@/lib/api/domain-types";
import type { AdherenceTrendPoint, CreatorAdherenceTrendResult } from "@/lib/api/domain-types";
import type { InsightTrend } from "@/components/radar/InsightCard";

export const RISK_LEVEL_ORDER: Record<RiskLevel, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export function sortBySeverity(students: ChurnRiskResult[]): ChurnRiskResult[] {
  return [...students].sort(
    (a, b) =>
      RISK_LEVEL_ORDER[b.level] - RISK_LEVEL_ORDER[a.level] || b.score - a.score,
  );
}

export function riskReason(student: ChurnRiskResult): string {
  const first = student.assumptions?.[0]?.trim();
  return first || "Sinais de queda na retenção";
}

export function hasCheckInsFromAssumptions(assumptions: string[] | undefined): boolean {
  if (!assumptions?.length) return true;
  return !assumptions.some((line) => /Sem nenhum check-in/i.test(line));
}

export function trendFromChange(change: string | null | undefined): InsightTrend {
  if (change == null || change === "") return "flat";
  const n = parseFloat(change);
  if (!Number.isFinite(n) || n === 0) return "flat";
  return n > 0 ? "up" : "down";
}

export function formatChangeDelta(change: string | null | undefined): string | undefined {
  if (change == null || change === "") return undefined;
  const n = parseFloat(change);
  if (!Number.isFinite(n)) return undefined;
  const sign = n > 0 ? "+" : "";
  return `${sign}${change} pp vs período anterior`;
}

export function sparkFromWeeklySeries(series: AdherenceTrendPoint[]): number[] | undefined {
  const values = series
    .map((p) => (p.avgAdherence != null ? parseFloat(p.avgAdherence) : null))
    .filter((v): v is number => v != null && Number.isFinite(v));
  return values.length >= 2 ? values : undefined;
}

export function formatWeekLabel(weekStart: string): string {
  const date = new Date(`${weekStart}T12:00:00`);
  if (Number.isNaN(date.getTime())) return weekStart;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function adherenceTrendHasSeries(trend: CreatorAdherenceTrendResult | null): boolean {
  if (!trend?.weeklySeries?.length) return false;
  return trend.weeklySeries.filter((p) => p.avgAdherence != null).length >= 2;
}
