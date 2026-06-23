import { FitnessIcon } from "@/components/fitness/FitnessIcon";
import type { FitnessIconContext } from "@/lib/icons/fitness-icons";
import { cn } from "@/lib/utils";

type SpaceFieldLabelProps = {
  htmlFor?: string;
  icon: FitnessIconContext;
  children: React.ReactNode;
  className?: string;
  trailing?: React.ReactNode;
};

export function SpaceFieldLabel({
  htmlFor,
  icon,
  children,
  className,
  trailing,
}: SpaceFieldLabelProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground/90"
      >
        <FitnessIcon context={icon} className="size-3.5 opacity-80" />
        {children}
      </label>
      {trailing}
    </div>
  );
}
