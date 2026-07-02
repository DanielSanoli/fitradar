import { useId, useMemo, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { useCountUp } from "@/hooks/useCountUp";
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
  /** Stagger delay for dashboard entry animation (ms). */
  entryDelay?: number;
};

function buildSparkGeometry(spark: number[]) {
  const W = 116;
  const H = 34;
  if (spark.length < 2) return null;

  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const range = max - min || 1;
  const step = W / (spark.length - 1);
  const pts = spark.map((v, i) => [i * step, H - 3 - ((v - min) / range) * (H - 6)] as const);
  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  const last = pts[pts.length - 1]!;
  let length = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const dx = pts[i]![0] - pts[i - 1]![0];
    const dy = pts[i]![1] - pts[i - 1]![1];
    length += Math.hypot(dx, dy);
  }
  return { linePath, areaPath, last, length: Math.ceil(length) };
}

const trendStyles: Record<InsightTrend, { color: string; arrow: string; bg: string }> = {
  up: {
    color: "hsl(165 70% 58%)",
    arrow: "↑",
    bg: "hsl(165 76% 48% / 0.12)",
  },
  down: {
    color: "hsl(0 75% 72%)",
    arrow: "↓",
    bg: "hsl(var(--risk-high) / 0.12)",
  },
  flat: {
    color: "hsl(210 10% 62%)",
    arrow: "→",
    bg: "hsl(var(--muted) / 0.35)",
  },
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
  entryDelay = 0,
}: InsightCardProps) {
  const gradientId = useId();
  const animatedValue = useCountUp(value);
  const sparkGeometry = useMemo(() => (spark ? buildSparkGeometry(spark) : null), [spark]);
  const trendInfo = trendStyles[trend];
  const isCritical = riskLevel === "alto";
  const displayValue = typeof value === "number" || /^\d/.test(String(value)) ? animatedValue : value;

  return (
    <div
      className={cn(
        "insight-card-interactive relative flex h-full flex-col overflow-hidden rounded-[14px] border border-border p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] motion-safe:animate-fade-in-up",
        isCritical && "insight-card-critical",
        className,
      )}
      style={{
        animationDelay: entryDelay ? `${entryDelay}ms` : undefined,
        background: isCritical
          ? "linear-gradient(155deg, hsl(0 28% 14%), hsl(215 22% 11%))"
          : "linear-gradient(155deg, hsl(215 18% 15.5%), hsl(215 22% 11%))",
      }}
    >
      <div
        className="pointer-events-none absolute -right-[42px] -top-[52px] size-[150px] rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${isCritical ? "hsl(var(--glow-danger))" : glowColor}, transparent 68%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent to-40%"
        aria-hidden
      />

      <div className="relative flex h-full flex-col gap-4">
        <div className="flex min-h-6 flex-wrap items-start justify-between gap-2">
          <span className="insight-label flex items-center gap-1.5 whitespace-nowrap">
            {Icon ? <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden /> : null}
            {label}
          </span>
          {riskLevel ? (
            <RiskBadge level={riskLevel} label={riskLabel} pulse={isCritical} />
          ) : null}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="insight-value text-foreground">{displayValue}</span>
          {unit ? (
            <span className="font-display text-lg font-semibold tracking-tight text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex min-h-[22px] items-end justify-between gap-3">
          {delta ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-bold tracking-tight"
              style={{ color: trendInfo.color, background: trendInfo.bg }}
            >
              <span aria-hidden className="text-[15px] leading-none">
                {trendInfo.arrow}
              </span>
              {delta}
            </span>
          ) : (
            <span />
          )}
          {sparkGeometry ? (
            <svg
              width={116}
              height={34}
              viewBox="0 0 116 34"
              preserveAspectRatio="none"
              className="shrink-0 overflow-visible"
              aria-hidden
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={glowColor} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparkGeometry.areaPath} fill={glowColor} fillOpacity={0.12} stroke="none" />
              <path
                d={sparkGeometry.linePath}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="motion-safe:animate-draw-line"
                style={
                  {
                    strokeDasharray: sparkGeometry.length,
                    "--spark-length": `${sparkGeometry.length}px`,
                  } as CSSProperties
                }
              />
              <circle
                cx={sparkGeometry.last[0]}
                cy={sparkGeometry.last[1]}
                r={3}
                fill={glowColor}
                className="motion-safe:spark-endpoint"
                style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
              />
            </svg>
          ) : null}
        </div>
      </div>
    </div>
  );
}
