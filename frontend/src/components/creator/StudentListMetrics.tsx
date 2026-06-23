import { AdherenceRing } from "@/components/fitness/AdherenceRing";
import { StreakFlame } from "@/components/fitness/StreakFlame";
import { adherenceBarColor, formatAdherenceDisplay } from "@/lib/creator/display-utils";
import { cn } from "@/lib/utils";

type StudentListMetricsProps = {
  adherence: string | null | undefined;
  streak: number;
  showStreak: boolean;
  className?: string;
};

/** Mini adherence ring + label and optional streak flame for student list rows. */
export function StudentListMetrics({
  adherence,
  streak,
  showStreak,
  className,
}: StudentListMetricsProps) {
  const color = adherenceBarColor(adherence);
  const label = formatAdherenceDisplay(adherence);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2.5">
        <AdherenceRing value={adherence ?? null} size="xs" strokeColor={color} />
        <span className="min-w-[30px] text-[13px] font-bold tabular-nums" style={{ color }}>
          {label}
        </span>
      </div>
      {showStreak ? (
        <StreakFlame streak={streak} variant="inline" label="dias" className="text-[11px]" />
      ) : null}
    </div>
  );
}
