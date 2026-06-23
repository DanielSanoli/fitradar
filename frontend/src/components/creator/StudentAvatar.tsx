import { cn } from "@/lib/utils";
import { initials } from "@/lib/creator/display-utils";

type StudentAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "size-[38px] rounded-[11px] text-[13px]",
  md: "size-[66px] rounded-[18px] text-[22px]",
  lg: "size-9 rounded-[10px] text-[13px]",
};

export function StudentAvatar({ name, size = "sm", className }: StudentAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-border bg-secondary font-extrabold text-foreground",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
