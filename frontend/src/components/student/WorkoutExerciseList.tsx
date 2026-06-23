import { Dumbbell } from "lucide-react";
import { parseExerciseLines } from "@/lib/student/workout-content";

type WorkoutExerciseListProps = {
  contentMarkdown: string | null | undefined;
  className?: string;
};

function formatDetail(detail: string): string {
  const m = detail.match(/^(\d+)\s*[x×]\s*(.+)$/i);
  if (m) return `${m[1]} × ${m[2]}`;
  return detail;
}

/** Renders exercise lines from markdown — text only, no HTML injection. */
export function WorkoutExerciseList({ contentMarkdown, className }: WorkoutExerciseListProps) {
  const exercises = parseExerciseLines(contentMarkdown ?? "");

  if (exercises.length === 0) {
    return null;
  }

  return (
    <ul className={className}>
      {exercises.map((ex, index) => (
        <li key={`${ex.name}-${index}`} className="flex items-center gap-2.5">
          <Dumbbell className="size-3.5 shrink-0 text-primary/80" strokeWidth={2.25} aria-hidden />
          <span className="min-w-0 flex-1 text-sm text-foreground/90">{ex.name}</span>
          {ex.detail ? (
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-muted-foreground">
              {formatDetail(ex.detail)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
