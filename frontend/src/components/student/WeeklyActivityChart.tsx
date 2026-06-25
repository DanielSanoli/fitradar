import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import { cn } from "@/lib/utils";
import type { WeekBar } from "@/lib/student/weekly-activity";

const BAR_COLORS: Record<WeekBar["state"], string> = {
  done: "bg-primary",
  rest: "bg-violet-500/70",
  future: "bg-muted",
  "today-empty": "bg-muted",
};

type WeeklyActivityChartProps = {
  bars: WeekBar[];
  summary: string;
  className?: string;
};

export function WeeklyActivityChart({ bars, summary, className }: WeeklyActivityChartProps) {
  const { vocabulary: v } = useSpaceVocabulary();

  return (
    <div
      className={cn(
        "rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-foreground">Esta semana</span>
        <span className="text-xs text-muted-foreground">{summary}</span>
      </div>

      <div className="flex h-16 items-end justify-between gap-1.5" role="list" aria-label="Atividade da semana">
        {bars.map((bar, index) => (
          <div key={bar.date} className="flex h-full flex-1 flex-col items-center gap-1.5" role="listitem">
            <div className="flex w-full flex-1 items-end overflow-hidden rounded-md bg-secondary">
              <div
                className={cn(
                  "w-full origin-bottom rounded-md motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-500",
                  BAR_COLORS[bar.state],
                )}
                style={{
                  height: bar.height,
                  animationDelay: `${index * 60}ms`,
                }}
                aria-label={`${bar.label}: ${bar.state === "done" ? v.checkInChartDone : bar.state === "rest" ? "descanso" : "sem dados"}`}
                role="img"
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold",
                bar.isToday ? "text-primary" : "text-muted-foreground",
              )}
            >
              {bar.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-primary" aria-hidden />
          {v.checkInChartDone}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-violet-500/70" aria-hidden />
          Descanso
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-muted" aria-hidden />
          Sem dados
        </span>
      </div>
    </div>
  );
}
