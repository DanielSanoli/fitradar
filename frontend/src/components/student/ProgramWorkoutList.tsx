import { ChevronDown } from "lucide-react";
import { WorkoutExerciseList } from "@/components/student/WorkoutExerciseList";
import { Button } from "@/components/ui/button";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import type { WorkoutResponse } from "@/lib/api/domain-types";
import { formatItemContentCount } from "@/lib/space/vocabulary";
import { countExercises } from "@/lib/student/workout-content";
import { cn } from "@/lib/utils";

type ProgramWorkoutListProps = {
  programId: string;
  workouts: WorkoutResponse[];
  expanded: boolean;
  onToggle: () => void;
};

export function ProgramWorkoutList({
  programId,
  workouts,
  expanded,
  onToggle,
}: ProgramWorkoutListProps) {
  const { vocabulary: v } = useSpaceVocabulary();
  const ItemIcon = v.itemIcon;
  const programWorkouts = workouts
    .filter((w) => w.programId === programId)
    .sort((a, b) => a.dayIndex - b.dayIndex);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-[10px] gap-1.5"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        {expanded ? v.hideItems : v.viewItems}
        <ChevronDown
          className={cn("size-4 transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </Button>

      {expanded ? (
        programWorkouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{v.noItemPublished}</p>
        ) : (
          <ul
            className="space-y-2.5"
            aria-label={`${v.itemList} do ${v.program.singular}`}
          >
            {programWorkouts.map((workout) => {
              const exCount = countExercises(workout.contentMarkdown);
              return (
                <li
                  key={workout.id}
                  className="rounded-[13px] border border-border bg-secondary/25 px-3.5 py-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                      <ItemIcon className="size-4 text-primary" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-tight">{workout.title}</p>
                      {workout.description ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{workout.description}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Dia {workout.dayIndex + 1}
                        {exCount > 0 ? ` · ${formatItemContentCount(exCount, v)}` : ""}
                      </p>
                      {workout.contentMarkdown?.trim() ? (
                        <WorkoutExerciseList
                          contentMarkdown={workout.contentMarkdown}
                          className="mt-2.5 space-y-1.5"
                        />
                      ) : (
                        <p className="mt-2 text-xs italic text-muted-foreground">
                          Conteúdo em breve.
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      {expanded ? (
        <p className="text-xs text-muted-foreground">{v.checkInHomeHint}</p>
      ) : null}
    </div>
  );
}
