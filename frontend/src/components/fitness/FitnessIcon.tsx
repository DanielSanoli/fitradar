import type { LucideIcon } from "lucide-react";
import { fitnessIconMap, type FitnessIconContext } from "@/lib/icons/fitness-icons";
import { cn } from "@/lib/utils";

export type FitnessIconProps = {
  context: FitnessIconContext;
  className?: string;
  /** Accessible label when the icon carries meaning (not purely decorative). */
  label?: string;
};

export function FitnessIcon({ context, className, label }: FitnessIconProps) {
  const Icon: LucideIcon = fitnessIconMap[context];
  return (
    <Icon
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
