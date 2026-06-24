import { cn } from "@/lib/utils";

export type StudentHomeViewMode = "workout" | "rest" | "none";
export type StudentProgressViewMode = "active" | "early";

type ToggleOption<T extends string> = {
  value: T;
  label: string;
};

type StudentStatePreviewToggleProps<T extends string> = {
  label?: string;
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

/** Segmented control — matches prototype "Pré-visualizar estado" toggles. */
export function StudentStatePreviewToggle<T extends string>({
  label = "Pré-visualizar estado",
  value,
  options,
  onChange,
  className,
}: StudentStatePreviewToggleProps<T>) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </span>
      <div
        className="inline-flex gap-0.5 rounded-[11px] border border-border bg-secondary/80 p-0.5"
        role="group"
        aria-label={label}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "h-8 whitespace-nowrap rounded-[9px] px-3.5 text-[12.5px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const HOME_VIEW_OPTIONS: ToggleOption<StudentHomeViewMode>[] = [
  { value: "workout", label: "Treino" },
  { value: "rest", label: "Descanso" },
  { value: "none", label: "Sem programa" },
];

export const PROGRESS_VIEW_OPTIONS: ToggleOption<StudentProgressViewMode>[] = [
  { value: "active", label: "Progresso ativo" },
  { value: "early", label: "Início da jornada" },
];
