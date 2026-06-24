import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterPillProps = {
  label: ReactNode;
  active?: boolean;
  onClick: () => void;
  "aria-current"?: boolean | "true" | "false";
};

export function FilterPill({ label, active, onClick, "aria-current": ariaCurrent }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? ariaCurrent ?? true : undefined}
      className={cn(
        "h-9 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
