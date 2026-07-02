import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Salad, Search, Trash2 } from "lucide-react";
import { NutritionDisclaimer } from "@/components/nutrition/NutritionDisclaimer";
import { CreatorSpaceRequiredPrompt } from "@/components/creator/CreatorSpaceRequiredPrompt";
import { NutrientTotalsDisplay } from "@/components/nutrition/NutrientTotalsDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import type { FoodResponse, NutritionPlanResponse } from "@/lib/api/domain-types";
import { nutritionApi } from "@/lib/api/nutrition-api";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type StructuredNutritionPanelProps = {
  programId: string;
  canWrite?: boolean;
};

export function StructuredNutritionPanel({ programId, canWrite = true }: StructuredNutritionPanelProps) {
  const { toast } = useToast();
  const [plan, setPlan] = useState<NutritionPlanResponse | null>(null);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();

  const [mealName, setMealName] = useState("");
  const [mealTime, setMealTime] = useState("");
  const [activeMealId, setActiveMealId] = useState<string | null>(null);

  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FoodResponse[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodResponse | null>(null);
  const [quantityG, setQuantityG] = useState("100");
  const [searching, setSearching] = useState(false);

  const [showCustomFood, setShowCustomFood] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");

  const mealCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollToMealIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await nutritionApi.getPlan(programId);
      setPlan(data);
      setActiveMealId((current) =>
        current && data.meals.some((meal) => meal.id === current) ? current : null,
      );
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar plano estruturado.");
      setState("error");
    }
  }, [programId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const mealId = scrollToMealIdRef.current;
    if (!mealId) return;
    const card = mealCardRefs.current.get(mealId);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    scrollToMealIdRef.current = null;
  }, [activeMealId, plan?.meals]);

  const toggleMealEdit = (mealId: string) => {
    if (activeMealId === mealId) {
      setActiveMealId(null);
      return;
    }
    scrollToMealIdRef.current = mealId;
    setActiveMealId(mealId);
  };

  const searchFoods = async () => {
    if (foodQuery.trim().length < 2) {
      toast("Digite ao menos 2 caracteres.", "error");
      return;
    }
    setSearching(true);
    try {
      const results = await nutritionApi.searchFoods(foodQuery.trim());
      setFoodResults(results);
      if (results.length === 0) {
        toast("Nenhum alimento encontrado. Crie um custom abaixo.");
      }
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro na busca.", "error");
    } finally {
      setSearching(false);
    }
  };

  const createMeal = async () => {
    if (!mealName.trim()) {
      toast("Informe o nome da refeição.", "error");
      return;
    }
    try {
      const meal = await nutritionApi.createMeal(programId, {
        nome: mealName.trim(),
        horario: mealTime || null,
      });
      setMealName("");
      setMealTime("");
      scrollToMealIdRef.current = meal.id;
      setActiveMealId(meal.id);
      await load();
      toast("Refeição adicionada.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao criar refeição.", "error");
    }
  };

  const addItem = async () => {
    if (!activeMealId || !selectedFood) {
      toast("Selecione uma refeição e um alimento.", "error");
      return;
    }
    try {
      await nutritionApi.addMealItem(programId, activeMealId, {
        foodId: selectedFood.id,
        quantidadeG: quantityG,
      });
      setSelectedFood(null);
      setFoodResults([]);
      setFoodQuery("");
      await load();
      toast("Alimento adicionado.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao adicionar alimento.", "error");
    }
  };

  const createCustomFood = async () => {
    if (!customName.trim()) {
      toast("Informe o nome do alimento.", "error");
      return;
    }
    try {
      const food = await nutritionApi.createCustomFood({
        nome: customName.trim(),
        kcalPor100g: customKcal || "0",
        proteinaPor100g: customProtein || "0",
        carboPor100g: customCarbs || "0",
        gorduraPor100g: customFat || "0",
      });
      setSelectedFood(food);
      setShowCustomFood(false);
      setCustomName("");
      toast("Alimento custom criado.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao criar alimento.", "error");
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      await nutritionApi.deleteMeal(programId, mealId);
      if (activeMealId === mealId) setActiveMealId(null);
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao remover refeição.", "error");
    }
  };

  const deleteItem = async (mealId: string, itemId: string) => {
    try {
      await nutritionApi.deleteMealItem(programId, mealId, itemId);
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao remover item.", "error");
    }
  };

  const renderAddFoodForm = () => (
    <div
      className={cn(
        "mt-4 overflow-hidden rounded-[12px] border border-primary/25 bg-primary/5 p-4",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200",
      )}
    >
      <p className="mb-3 text-sm font-semibold">Adicionar alimento</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar na TACO (ex.: arroz)"
          value={foodQuery}
          onChange={(e) => setFoodQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void searchFoods()}
        />
        <Button variant="outline" onClick={() => void searchFoods()} disabled={searching} className="gap-1.5">
          <Search className="size-4" aria-hidden />
          Buscar
        </Button>
      </div>

      {foodResults.length > 0 ? (
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-[10px] border border-border bg-card p-2">
          {foodResults.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                className="w-full rounded-[8px] px-2 py-2 text-left text-sm hover:bg-secondary/60"
                onClick={() => setSelectedFood(food)}
              >
                <span className="font-medium">{food.nome}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {food.kcalPor100g} kcal/100g · {food.fonte}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selectedFood ? (
        <p className="mt-2 text-sm">
          Selecionado: <strong>{selectedFood.nome}</strong>
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr_auto]">
        <div>
          <Label htmlFor="quantity-g">Quantidade (g)</Label>
          <Input id="quantity-g" value={quantityG} onChange={(e) => setQuantityG(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => void addItem()} disabled={!selectedFood}>
            Adicionar ao plano
          </Button>
        </div>
      </div>

      <Button variant="link" className="mt-2 h-auto p-0 text-xs" onClick={() => setShowCustomFood((v) => !v)}>
        {showCustomFood ? "Ocultar criar alimento" : "Não encontrou? Criar alimento custom"}
      </Button>

      {showCustomFood ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input placeholder="Nome" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          <Input placeholder="kcal/100g" value={customKcal} onChange={(e) => setCustomKcal(e.target.value)} />
          <Input placeholder="Proteína/100g" value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} />
          <Input placeholder="Carbo/100g" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} />
          <Input placeholder="Gordura/100g" value={customFat} onChange={(e) => setCustomFat(e.target.value)} />
          <Button variant="secondary" onClick={() => void createCustomFood()}>
            Salvar alimento custom
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-5">
      <NutritionDisclaimer />

      {!canWrite ? <CreatorSpaceRequiredPrompt compact /> : null}

      <PanelState state={state} message={error} onRetry={load}>
        {plan ? (
          <div className="space-y-5">
            <div className="rounded-[14px] border border-border bg-card p-4 shadow-[0_6px_24px_rgba(0,0,0,0.22)]">
              <p className="text-sm font-semibold">Total do dia</p>
              <div className="mt-3">
                <NutrientTotalsDisplay totals={plan.dailyTotals} />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">{plan.weeklyProjectionLabel}</p>
              <div className="mt-2">
                <NutrientTotalsDisplay totals={plan.weeklyProjection} compact />
              </div>
            </div>

            {canWrite ? (
              <div className="rounded-[14px] border border-border bg-card p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Salad className="size-4 text-primary" aria-hidden />
                  Nova refeição
                </p>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <Input placeholder="Ex.: Café da manhã" value={mealName} onChange={(e) => setMealName(e.target.value)} />
                  <Input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} className="sm:w-36" />
                  <Button onClick={() => void createMeal()} className="gap-1.5">
                    <Plus className="size-4" aria-hidden />
                    Adicionar
                  </Button>
                </div>
              </div>
            ) : null}

            {plan.meals.map((meal) => {
              const isEditing = activeMealId === meal.id;

              return (
                <div
                  key={meal.id}
                  ref={(node) => {
                    if (node) mealCardRefs.current.set(meal.id, node);
                    else mealCardRefs.current.delete(meal.id);
                  }}
                  className={cn(
                    "rounded-[14px] border p-4 transition-[box-shadow,background-color,border-color] duration-200",
                    isEditing
                      ? "border-primary/40 bg-primary/5 ring-2 ring-primary/50 shadow-[0_6px_24px_hsl(var(--primary)/0.12)]"
                      : "border-border bg-card",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{meal.nome}</p>
                        {isEditing ? (
                          <span className="rounded-full border border-primary/35 bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                            Editando
                          </span>
                        ) : null}
                      </div>
                      {meal.horario ? (
                        <p className="text-xs text-muted-foreground">{meal.horario.slice(0, 5)}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      {canWrite ? (
                        <>
                          <Button
                            size="sm"
                            variant={isEditing ? "default" : "outline"}
                            onClick={() => toggleMealEdit(meal.id)}
                          >
                            {isEditing ? "Fechar edição" : "Editar itens"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => void deleteMeal(meal.id)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {meal.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum alimento ainda.</p>
                    ) : (
                      meal.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-border/70 bg-secondary/20 px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">{item.foodNome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantidadeG} g · {item.foodFonte}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <NutrientTotalsDisplay totals={item.totals} compact className="min-w-[180px]" />
                            {canWrite ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => void deleteItem(meal.id, item.id)}
                              >
                                <Trash2 className="size-4" aria-hidden />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {canWrite && isEditing ? renderAddFoodForm() : null}

                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Totais da refeição
                    </p>
                    <NutrientTotalsDisplay totals={meal.totals} compact className="mt-2" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </PanelState>
    </div>
  );
}
