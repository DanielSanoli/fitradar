import { cn } from "@/lib/utils";

type FilterPillProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

export function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
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
