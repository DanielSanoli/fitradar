import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_PER_SHIELD = 7;
const MAX_SHIELDS = 2;

export type StreakShieldsBadgeProps = {
  count: number;
  earnProgress?: number;
  compact?: boolean;
  className?: string;
};

export function StreakShieldsBadge({
  count,
  earnProgress = 0,
  compact = false,
  className,
}: StreakShieldsBadgeProps) {
  const capped = Math.min(Math.max(count, 0), MAX_SHIELDS);
  const progress = Math.min(Math.max(earnProgress, 0), DAYS_PER_SHIELD - 1);
  const showProgress = capped < MAX_SHIELDS && progress > 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-sky-500/35 bg-sky-500/10",
        compact ? "px-2 py-0.5" : "px-2.5 py-1",
        className,
      )}
      title={
        capped >= MAX_SHIELDS
          ? "Máximo de escudos (2)"
          : showProgress
            ? `${progress}/${DAYS_PER_SHIELD} dias até o próximo escudo`
            : "Escudos protegem 1 dia perdido na sequência"
      }
    >
      <Shield
        className={cn("shrink-0 text-sky-400", compact ? "size-3.5" : "size-4")}
        aria-hidden
      />
      <span className={cn("font-bold tabular-nums text-sky-300", compact ? "text-xs" : "text-sm")}>
        {capped}
      </span>
      {!compact && showProgress ? (
        <span className="text-[10px] font-semibold text-sky-400/80">
          {progress}/{DAYS_PER_SHIELD}
        </span>
      ) : null}
    </div>
  );
}
