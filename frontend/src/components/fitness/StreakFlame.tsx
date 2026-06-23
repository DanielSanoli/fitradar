import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export type StreakFlameProps = {
  /** Streak count from backend DTO. */
  streak: number;
  label?: string;
  subtitle?: string | null;
  /** Compact inline vs prominent card-style. */
  variant?: "inline" | "prominent";
  className?: string;
};

export function StreakFlame({
  streak,
  label = "dias seguidos",
  subtitle,
  variant = "prominent",
  className,
}: StreakFlameProps) {
  const active = streak > 0;

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Flame
          className={cn(
            "size-4 shrink-0",
            active ? "text-flame streak-flame-pulse" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <span className="font-bold tabular-nums">{streak}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl border",
          active
            ? "border-flame/35 bg-flame/15"
            : "border-border bg-muted/40",
        )}
        aria-hidden
      >
        <Flame
          className={cn(
            "size-5",
            active ? "text-flame streak-flame-pulse" : "text-muted-foreground",
          )}
        />
      </div>
      <div>
        <p className="text-2xl font-extrabold tabular-nums text-flame">{streak}</p>
        <p className="text-sm font-semibold">{label}</p>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
