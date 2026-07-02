import { cn } from "@/lib/utils";
import type { UiRiskLevel } from "@/lib/api/domain-types";

const styles: Record<
  UiRiskLevel,
  { label: string; bg: string; fg: string; bd: string; dot: string }
> = {
  baixo: {
    label: "Risco baixo",
    bg: "hsl(var(--risk-low) / 0.12)",
    fg: "hsl(165 55% 70%)",
    bd: "hsl(var(--risk-low) / 0.32)",
    dot: "hsl(var(--risk-low))",
  },
  medio: {
    label: "Risco médio",
    bg: "hsl(var(--risk-medium) / 0.12)",
    fg: "hsl(38 92% 70%)",
    bd: "hsl(var(--risk-medium) / 0.34)",
    dot: "hsl(var(--risk-medium))",
  },
  alto: {
    label: "Risco alto",
    bg: "hsl(var(--risk-high) / 0.14)",
    fg: "hsl(0 82% 80%)",
    bd: "hsl(var(--risk-high) / 0.36)",
    dot: "hsl(var(--risk-high))",
  },
};

export type RiskBadgeProps = {
  level: UiRiskLevel;
  label?: string;
  className?: string;
  pulse?: boolean;
};

export function RiskBadge({ level, label, className, pulse = false }: RiskBadgeProps) {
  const m = styles[level] ?? styles.alto;
  const text = label?.trim() ? label : m.label;
  const shouldPulse = pulse || level === "alto";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        shouldPulse && "motion-safe:animate-pulse-soft",
        className,
      )}
      style={{
        background: m.bg,
        color: m.fg,
        borderColor: m.bd,
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: m.dot, boxShadow: `0 0 8px ${m.dot}` }}
        aria-hidden
      />
      {text}
    </span>
  );
}
