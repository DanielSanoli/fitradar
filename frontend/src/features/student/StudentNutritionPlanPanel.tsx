import { useCallback, useEffect, useState } from "react";
import { Clock, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NutritionDisclaimer } from "@/components/nutrition/NutritionDisclaimer";
import { NutrientTotalsDisplay } from "@/components/nutrition/NutrientTotalsDisplay";
import { PanelState } from "@/components/ui/PanelState";
import { StaggerItem } from "@/components/motion/StaggerList";
import type { NutritionPlanResponse } from "@/lib/api/domain-types";
import { nutritionApi } from "@/lib/api/nutrition-api";
import { ApiError } from "@/lib/api/types";

type StudentNutritionPlanPanelProps = {
  programId: string;
  programTitle: string;
};

export function StudentNutritionPlanPanel({ programId, programTitle }: StudentNutritionPlanPanelProps) {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<NutritionPlanResponse | null>(null);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await nutritionApi.getStudentPlan(programId);
      setPlan(data);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar plano alimentar.");
      setState("error");
    }
  }, [programId]);

  useEffect(() => {
    void load();
  }, [load]);

  const panelState =
    state === "content" && plan && plan.meals.length === 0 ? ("empty" as const) : state;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">{programTitle}</h2>
        <p className="text-sm text-muted-foreground">Plano alimentar com macros calculados pelo motor.</p>
      </div>

      <NutritionDisclaimer />

      <PanelState
        state={panelState}
        message={
          panelState === "empty"
            ? "Seu coach ainda não montou refeições neste plano."
            : error
        }
        onRetry={load}
        emptyVariant="student"
        iconContext="nutrition"
        title="Plano em preparação"
        skeletonVariant="cards"
        rows={2}
        actionLabel="Ver programas"
        onAction={() => navigate("/student/programs")}
      >
        {plan && plan.meals.length > 0 ? (
          <div className="space-y-4">
            <div className="rounded-[14px] border border-primary/25 bg-gradient-to-br from-primary/10 to-card p-4">
              <p className="text-sm font-semibold">Total do dia</p>
              <NutrientTotalsDisplay totals={plan.dailyTotals} className="mt-3" />
            </div>

            {plan.meals.map((meal, index) => (
              <StaggerItem key={meal.id} index={index}>
                <article className="app-card-interactive rounded-[14px] border border-border bg-card p-4 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="size-4 text-primary" aria-hidden />
                      <h3 className="font-semibold">{meal.nome}</h3>
                    </div>
                    {meal.horario ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" aria-hidden />
                        {meal.horario.slice(0, 5)}
                      </span>
                    ) : null}
                  </header>

                  <ul className="mt-3 space-y-2">
                    {meal.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-secondary/25 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">{item.foodNome}</p>
                          <p className="text-xs text-muted-foreground">{item.quantidadeG} g</p>
                        </div>
                        <NutrientTotalsDisplay totals={item.totals} compact className="min-w-[160px]" />
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 border-t border-border/60 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Totais da refeição
                    </p>
                    <NutrientTotalsDisplay totals={meal.totals} compact className="mt-2" />
                  </div>
                </article>
              </StaggerItem>
            ))}

            <div className="rounded-[12px] border border-dashed border-border/80 bg-secondary/15 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {plan.weeklyProjectionLabel}
              </p>
              <NutrientTotalsDisplay totals={plan.weeklyProjection} compact className="mt-2" />
            </div>
          </div>
        ) : null}
      </PanelState>
    </div>
  );
}
