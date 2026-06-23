import { cn } from "@/lib/utils";
import { adherenceBarColor, adherenceBarWidth, formatAdherenceDisplay } from "@/lib/creator/display-utils";

type AdherenceBarCellProps = {
  adherence: string | null | undefined;
  className?: string;
};

export function AdherenceBarCell({ adherence, className }: AdherenceBarCellProps) {
  const color = adherenceBarColor(adherence);
  const width = adherenceBarWidth(adherence);
  const label = formatAdherenceDisplay(adherence);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all"
          style={{ width, background: color }}
        />
      </div>
      <span
        className="min-w-[30px] shrink-0 text-right text-[13px] font-bold"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
