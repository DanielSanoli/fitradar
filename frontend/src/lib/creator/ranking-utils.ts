import type { CreatorRankingEntry, RankingMetric } from "@/lib/api/domain-types";
import { formatAdherenceDisplay } from "@/lib/creator/display-utils";

export function formatRankingValue(
  metric: RankingMetric,
  value: string | null | undefined,
): { display: string; unit: string; ariaLabel: string } {
  if (metric === "STREAK") {
    const n = value != null ? parseInt(value, 10) : 0;
    const safe = Number.isFinite(n) ? n : 0;
    return {
      display: String(safe),
      unit: safe === 1 ? "dia" : "dias",
      ariaLabel: `${safe} ${safe === 1 ? "dia" : "dias"} de streak`,
    };
  }
  const display = formatAdherenceDisplay(value);
  return {
    display: display === "—" ? "—" : display.replace("%", ""),
    unit: display === "—" ? "" : "%",
    ariaLabel: display === "—" ? "aderência indisponível" : `aderência ${display}`,
  };
}

export function podiumOrder(entries: CreatorRankingEntry[]): CreatorRankingEntry[] {
  const top = entries.slice(0, 3);
  if (top.length <= 1) return top;
  if (top.length === 2) return [top[1], top[0]];
  return [top[1], top[0], top[2]];
}

export const MEDAL_STYLES = {
  1: {
    label: "Ouro",
    ring: "border-[hsl(45_96%_58%/0.55)]",
    bg: "bg-[hsl(45_96%_58%/0.12)]",
    glow: "shadow-[0_0_24px_hsl(45_96%_58%/0.35)]",
    text: "text-[hsl(45_96%_68%)]",
  },
  2: {
    label: "Prata",
    ring: "border-[hsl(210_12%_72%/0.45)]",
    bg: "bg-[hsl(210_12%_72%/0.10)]",
    glow: "shadow-[0_0_20px_hsl(210_12%_72%/0.25)]",
    text: "text-[hsl(210_12%_78%)]",
  },
  3: {
    label: "Bronze",
    ring: "border-[hsl(28_72%_52%/0.45)]",
    bg: "bg-[hsl(28_72%_52%/0.10)]",
    glow: "shadow-[0_0_20px_hsl(28_72%_52%/0.25)]",
    text: "text-[hsl(28_72%_62%)]",
  },
} as const;

export function podiumHeight(rank: number): string {
  if (rank === 1) return "h-[132px]";
  if (rank === 2) return "h-[108px]";
  return "h-[96px]";
}
