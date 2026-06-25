import { useCallback, useEffect, useState } from "react";
import { Check, Circle, Sparkles, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import type { OnboardingStatusResponse } from "@/lib/api/domain-types";
import { onboardingApi } from "@/lib/api/onboarding-api";
import {
  CREATOR_ONBOARDING_STEPS,
  nextOnboardingStep,
  onboardingProgressCount,
} from "@/lib/creator/onboarding-steps";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type CreatorOnboardingChecklistProps = {
  onStatusChange?: (status: OnboardingStatusResponse) => void;
  className?: string;
};

export function CreatorOnboardingChecklist({
  onStatusChange,
  className,
}: CreatorOnboardingChecklistProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await onboardingApi.status();
      setStatus(data);
      onStatusChange?.(data);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar onboarding.");
      setState("error");
    }
  }, [onStatusChange]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const data = await onboardingApi.seedDemo();
      setStatus(data);
      onStatusChange?.(data);
      toast("Programa demo criado — explore treinos e o painel preenchido.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível criar o exemplo.", "error");
    } finally {
      setSeeding(false);
    }
  };

  if (state === "content" && status?.onboardingComplete) {
    return null;
  }

  const progress = status ? onboardingProgressCount(status) : 0;
  const nextStep = status ? nextOnboardingStep(status) : null;

  return (
    <section
      aria-labelledby="onboarding-heading"
      className={cn(
        "overflow-hidden rounded-[14px] border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="h-1 bg-gradient-to-r from-primary to-primary/60" aria-hidden />
      <div className="space-y-4 px-5 py-5 md:px-6 md:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 shrink-0 text-primary" aria-hidden />
              <h2 id="onboarding-heading" className="text-lg font-extrabold tracking-tight">
                Primeiros passos
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure seu FitRadar em poucos minutos — progresso real da sua conta.
            </p>
          </div>
          {status ? (
            <span className="inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary tabular-nums">
              {progress}/{CREATOR_ONBOARDING_STEPS.length} concluídos
            </span>
          ) : null}
        </div>

        <PanelState state={state} message={error} onRetry={load} rows={3}>
          {status ? (
            <>
              <ol className="flex list-none flex-col gap-2.5 p-0">
                {CREATOR_ONBOARDING_STEPS.map((step, index) => {
                  const completed = step.done(status);
                  const isNext = nextStep?.id === step.id;

                  return (
                    <li key={step.id}>
                      <div
                        className={cn(
                          "flex gap-3 rounded-[12px] border px-3.5 py-3.5 transition-colors",
                          completed
                            ? "border-primary/25 bg-primary/5"
                            : isNext
                              ? "border-primary/35 bg-card"
                              : "border-border bg-card/60",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                            completed
                              ? "border-primary/40 bg-primary/15 text-primary"
                              : "border-border bg-muted/40 text-muted-foreground",
                          )}
                          aria-hidden
                        >
                          {completed ? (
                            <Check className="size-4" strokeWidth={3} />
                          ) : (
                            index + 1
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold">{step.title}</h3>
                            {completed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                                <Check className="size-3" strokeWidth={3} aria-hidden />
                                Feito
                              </span>
                            ) : isNext ? (
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                                Próximo passo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <Circle className="size-2 fill-current" aria-hidden />
                                Pendente
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                            {step.description}
                          </p>
                          {!completed ? (
                            <Button
                              asChild
                              size="sm"
                              variant={isNext ? "default" : "outline"}
                              className={cn(
                                "mt-2.5 h-9 rounded-[10px] font-semibold",
                                isNext && "shadow-[0_4px_14px_hsl(var(--primary)/0.28)]",
                              )}
                            >
                              <Link to={step.to}>{step.actionLabel}</Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {status.demoSeedAvailable ? (
                <div className="rounded-[12px] border border-dashed border-border bg-muted/25 px-4 py-3.5">
                  <p className="text-sm font-semibold">Quer ver o produto cheio?</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Criamos um programa demo com treinos de exemplo para você explorar antes de
                    publicar o seu.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2 rounded-[10px] font-semibold"
                    disabled={seeding}
                    onClick={() => void handleSeedDemo()}
                  >
                    <Wand2 className="size-4" aria-hidden />
                    {seeding ? "Criando exemplo…" : "Ver com dados de exemplo"}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </PanelState>
      </div>
    </section>
  );
}
