import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { RiskBadge } from "@/components/radar/RiskBadge";
import type { UiRiskLevel } from "@/lib/api/domain-types";
import { cn } from "@/lib/utils";

export type InsightTrend = "up" | "down" | "flat";

export type InsightCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  trend?: InsightTrend;
  spark?: number[];
  riskLevel?: UiRiskLevel | "";
  riskLabel?: string;
  glowColor?: string;
  icon?: LucideIcon;
  className?: string;
};

function buildSparkPaths(spark: number[]) {
  const W = 116;
  const H = 34;
  if (spark.length < 2) return null;

  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const range = max - min || 1;
  const step = W / (spark.length - 1);
  const pts = spark.map((v, i) => [i * step, H - 3 - ((v - min) / range) * (H - 6)] as const);
  const points = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPoints = `0,${H} ${points} ${W},${H}`;
  return { points, areaPoints };
}

const trendStyles: Record<InsightTrend, { color: string; arrow: string }> = {
  up: { color: "hsl(165 70% 58%)", arrow: "↑" },
  down: { color: "hsl(0 75% 72%)", arrow: "↓" },
  flat: { color: "hsl(210 10% 62%)", arrow: "→" },
};

export function InsightCard({
  label,
  value,
  unit = "",
  delta,
  trend = "flat",
  spark,
  riskLevel,
  riskLabel,
  glowColor = "hsl(var(--glow-accent))",
  icon: Icon,
  className,
}: InsightCardProps) {
  const sparkPaths = useMemo(() => (spark ? buildSparkPaths(spark) : null), [spark]);
  const trendInfo = trendStyles[trend];

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[14px] border border-border p-[18px_20px] shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
        className,
      )}
      style={{
        background: "linear-gradient(155deg, hsl(215 18% 15.5%), hsl(215 22% 11%))",
      }}
    >
      <div
        className="pointer-events-none absolute -right-[42px] -top-[52px] size-[150px] rounded-full opacity-15"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent 68%)` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent to-40%"
        aria-hidden
      />

      <div className="relative flex h-full flex-col gap-3.5">
        <div className="flex min-h-6 flex-wrap items-start justify-between gap-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[11.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            {Icon ? <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden /> : null}
            {label}
          </span>
          {riskLevel ? <RiskBadge level={riskLevel} label={riskLabel} /> : null}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[38px] font-extrabold leading-none tracking-tight text-foreground">
            {value}
          </span>
          {unit ? (
            <span className="text-base font-semibold text-muted-foreground">{unit}</span>
          ) : null}
        </div>

        <div className="mt-auto flex min-h-[18px] items-end justify-between gap-2.5">
          {delta ? (
            <span
              className="inline-flex items-center gap-1 text-[12.5px] font-bold"
              style={{ color: trendInfo.color }}
            >
              {trendInfo.arrow} {delta}
            </span>
          ) : (
            <span />
          )}
          {sparkPaths ? (
            <svg
              width={116}
              height={34}
              viewBox="0 0 116 34"
              preserveAspectRatio="none"
              className="shrink-0 overflow-visible"
              aria-hidden
            >
              <polyline
                points={sparkPaths.areaPoints}
                fill={glowColor}
                fillOpacity={0.1}
                stroke="none"
              />
              <polyline
                points={sparkPaths.points}
                fill="none"
                stroke={glowColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </div>
      </div>
    </div>
  );
}
