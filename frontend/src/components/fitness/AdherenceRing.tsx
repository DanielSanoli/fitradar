import { formatAdherence } from "@/lib/api/domain-types";
import { cn } from "@/lib/utils";

export type AdherenceRingProps = {
  /** Adherence string from backend DTO (e.g. "80.00"). */
  value: string | null;
  /** Ring diameter in px — fixed to avoid layout shift. */
  size?: "xs" | "sm" | "md" | "lg" | "compact";
  periodLabel?: string;
  /** Optional label below ring (display copy from DTO tier). */
  statusLabel?: string;
  strokeColor?: string;
  className?: string;
};

const sizeConfig = {
  xs: { box: "size-9", r: 16, stroke: 3, valueClass: "text-[8px]", labelClass: "hidden" },
  compact: { box: "size-[100px]", r: 48, stroke: 10, valueClass: "text-2xl", labelClass: "text-[10px]" },
  sm: { box: "size-24", r: 38, stroke: 7, valueClass: "text-xl", labelClass: "text-[10px]" },
  md: { box: "size-36", r: 54, stroke: 10, valueClass: "text-3xl", labelClass: "text-xs" },
  lg: { box: "size-44", r: 66, stroke: 12, valueClass: "text-4xl", labelClass: "text-xs" },
} as const;

/** Apple Fitness–style progress ring — visual only; value comes from the backend. */
export function AdherenceRing({
  value,
  size = "md",
  periodLabel = "30 dias",
  statusLabel,
  strokeColor,
  className,
}: AdherenceRingProps) {
  const cfg = sizeConfig[size];
  const hidePeriod = size === "xs";
  const parsed = value != null && value !== "" ? parseFloat(value) : NaN;
  const pct = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
  const c = 2 * Math.PI * cfg.r;
  const offset = c - (pct / 100) * c;
  const display = formatAdherence(value);
  const stroke = strokeColor ?? "hsl(var(--primary))";
  const gradId = `adherence-gradient-${size}`;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative shrink-0", cfg.box)}>
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="64"
          cy="64"
          r={cfg.r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={cfg.stroke}
        />
        <circle
          cx="64"
          cy="64"
          r={cfg.r}
          fill="none"
          stroke={strokeColor ? stroke : `url(#${gradId})`}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={strokeColor ? { filter: `drop-shadow(0 0 6px ${stroke})` } : undefined}
        />
        {!strokeColor ? (
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(165 76% 62%)" />
            </linearGradient>
          </defs>
        ) : null}
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="img"
        aria-label={`Aderência ${display}${hidePeriod ? "" : ` em ${periodLabel}`}`}
      >
        {!hidePeriod ? (
          <>
            <span className={cn("font-extrabold leading-none tracking-tight", cfg.valueClass)}>
              {display}
            </span>
            <span className={cn("text-muted-foreground", cfg.labelClass)}>{periodLabel}</span>
          </>
        ) : null}
      </div>
      </div>
      {statusLabel ? (
        <p className="mt-2 text-center text-xs font-semibold" style={{ color: stroke }}>
          {statusLabel}
        </p>
      ) : null}
    </div>
  );
}
