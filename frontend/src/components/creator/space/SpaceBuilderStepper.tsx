import { Check } from "lucide-react";
import { FitnessIcon } from "@/components/fitness/FitnessIcon";
import { cn } from "@/lib/utils";
import { foregroundOnAccent, rgbaHex } from "@/lib/creator/space-theme";
import type { FitnessIconContext } from "@/lib/icons/fitness-icons";

const STEPS: { n: 1 | 2 | 3; label: string; sub: string; icon: FitnessIconContext }[] = [
  { n: 1, label: "Espaço", sub: "Identidade", icon: "space" },
  { n: 2, label: "Primeiro programa", sub: "Conteúdo", icon: "programs" },
  { n: 3, label: "Convidar aluno", sub: "Lançar", icon: "invite" },
];

type SpaceBuilderStepperProps = {
  step: number;
  accent: string;
  onStep: (step: number) => void;
};

export function SpaceBuilderStepper({ step, accent, onStep }: SpaceBuilderStepperProps) {
  const accentFg = foregroundOnAccent(accent);
  const accentSoft = rgbaHex(accent, 0.16);
  const accentBorder = rgbaHex(accent, 0.4);

  return (
    <nav className="flex items-stretch gap-2.5" aria-label="Passos do construtor">
      {STEPS.map((st) => {
        const done = st.n < step;
        const active = st.n === step;

        return (
          <button
            key={st.n}
            type="button"
            aria-current={active ? "step" : undefined}
            onClick={() => onStep(st.n)}
            className={cn(
              "flex flex-1 items-center gap-2.5 rounded-[13px] border px-3.5 py-3 text-left transition-colors",
              active ? "border-[var(--step-border)] bg-[var(--step-bg)]" : "border-border bg-card/80",
            )}
            style={
              active
                ? ({
                    "--step-border": accentBorder,
                    "--step-bg": accentSoft,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <span
              className={cn(
                "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] text-[13px] font-extrabold",
                !active && !done && "border border-border bg-secondary text-muted-foreground",
              )}
              style={
                active
                  ? { background: accent, color: accentFg }
                  : done
                    ? {
                        background: accentSoft,
                        color: accent,
                        border: `1px solid ${accentBorder}`,
                      }
                    : undefined
              }
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : st.n}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-[13.5px] font-bold whitespace-nowrap",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <FitnessIcon context={st.icon} className="size-3.5 shrink-0 opacity-75" />
                {st.label}
              </span>
              <span className="block text-[11.5px] text-muted-foreground">{st.sub}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
