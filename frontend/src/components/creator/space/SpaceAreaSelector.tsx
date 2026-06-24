import type { SpaceCategory } from "@/lib/creator/space-categories";
import { SPACE_CATEGORIES } from "@/lib/creator/space-categories";
import { cn } from "@/lib/utils";

type SpaceAreaSelectorProps = {
  value: SpaceCategory;
  onChange: (value: SpaceCategory) => void;
  accent?: string;
  className?: string;
};

export function SpaceAreaSelector({ value, onChange, accent, className }: SpaceAreaSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Área do espaço"
      className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3", className)}
    >
      {SPACE_CATEGORIES.map((option) => {
        const selected = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[12px] border px-3 py-3 text-center transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary/50 bg-primary/10 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]"
                : "border-border bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground",
            )}
            style={
              selected && accent
                ? {
                    borderColor: `${accent}66`,
                    backgroundColor: `${accent}1a`,
                    boxShadow: `0 0 0 1px ${accent}33`,
                  }
                : undefined
            }
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className="text-[13px] font-semibold leading-tight">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
