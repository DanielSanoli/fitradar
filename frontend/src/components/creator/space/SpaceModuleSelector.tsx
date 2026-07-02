import { Apple, Dumbbell } from "lucide-react";
import type { SpaceModule } from "@/lib/api/domain-types";
import { spaceModuleLabel } from "@/lib/creator/space-modules";
import { cn } from "@/lib/utils";

const MODULE_OPTIONS: Array<{
  id: SpaceModule;
  label: string;
  description: string;
  icon: typeof Dumbbell;
}> = [
  {
    id: "TRAINING",
    label: spaceModuleLabel("TRAINING"),
    description: "Programas, treinos e check-ins",
    icon: Dumbbell,
  },
  {
    id: "NUTRITION",
    label: spaceModuleLabel("NUTRITION"),
    description: "Planos alimentares com macros (TACO)",
    icon: Apple,
  },
];

type SpaceModuleSelectorProps = {
  value: SpaceModule[];
  onChange: (value: SpaceModule[]) => void;
  accent?: string;
  className?: string;
};

export function SpaceModuleSelector({ value, onChange, accent, className }: SpaceModuleSelectorProps) {
  const toggle = (module: SpaceModule) => {
    if (value.includes(module)) {
      if (value.length === 1) return;
      onChange(value.filter((item) => item !== module));
      return;
    }
    onChange([...value, module]);
  };

  return (
    <div
      role="group"
      aria-label="O que você oferece"
      className={cn("grid grid-cols-1 gap-2.5 sm:grid-cols-2", className)}
    >
      {MODULE_OPTIONS.map((option) => {
        const selected = value.includes(option.id);
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option.id)}
            className={cn(
              "flex min-h-[96px] flex-col items-start justify-center gap-2 rounded-[12px] border px-4 py-3 text-left transition-colors",
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
            <span className="text-[14px] font-semibold leading-tight">{option.label}</span>
            <span className="text-[12px] leading-snug text-muted-foreground">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}
