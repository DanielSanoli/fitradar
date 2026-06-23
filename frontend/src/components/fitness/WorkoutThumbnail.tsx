import { cn } from "@/lib/utils";
import {
  detectWorkoutVisualKind,
  workoutVisualIcon,
} from "@/lib/creator/workout-visual";
import { fitnessIconMap } from "@/lib/icons/fitness-icons";

export type WorkoutThumbnailProps = {
  title: string;
  description?: string | null;
  contentMarkdown?: string | null;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Illustrated workout placeholder — no media field in API; fixed dimensions prevent layout shift.
 */
export function WorkoutThumbnail({
  title,
  description,
  contentMarkdown,
  size = "md",
  className,
}: WorkoutThumbnailProps) {
  const sm = size === "sm";
  const kind = detectWorkoutVisualKind(title, description, contentMarkdown);
  const Icon = fitnessIconMap[workoutVisualIcon(kind)];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/20 via-primary/5 to-card",
        sm ? "size-12" : "size-16",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon
          className={cn("text-primary/80", sm ? "size-5" : "size-7")}
          strokeWidth={1.75}
        />
      </div>
      <span className="sr-only">Treino: {title}</span>
    </div>
  );
}
