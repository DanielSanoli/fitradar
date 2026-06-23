import { fitnessIconMap, type FitnessIconContext } from "@/lib/icons/fitness-icons";
import { cn } from "@/lib/utils";

export type FitnessEmptyIconProps = {
  context: FitnessIconContext;
  /** Creator screens: muted. Student screens: slightly more vibrant. */
  variant?: "creator" | "student";
  className?: string;
};

export function FitnessEmptyIcon({
  context,
  variant = "creator",
  className,
}: FitnessEmptyIconProps) {
  const Icon = fitnessIconMap[context];
  const vibrant = variant === "student";

  return (
    <div
      className={cn(
        "flex size-14 items-center justify-center rounded-2xl border",
        vibrant
          ? "border-primary/30 bg-primary/10"
          : "border-border bg-muted/40",
        className,
      )}
      aria-hidden
    >
      <Icon
        className={cn(
          "size-7",
          vibrant ? "text-primary" : "text-muted-foreground",
        )}
      />
    </div>
  );
}
