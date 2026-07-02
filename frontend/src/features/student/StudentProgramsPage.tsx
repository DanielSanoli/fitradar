import { useCallback, useEffect, useState } from "react";
import { Check, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StudentSpaceHero } from "@/components/student/StudentSpaceHero";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { ProgramWorkoutList } from "@/components/student/ProgramWorkoutList";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import { useStudentSpace } from "@/hooks/useStudentSpace";
import { memberApi } from "@/lib/api/member-api";
import type { StudentProgramResponse, WorkoutResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { startProgramCheckout } from "@/lib/billing/start-program-checkout";
import { PROGRAM_ACCENT_BARS } from "@/lib/creator/display-utils";
import { canEnrollFree, canPurchasePaid, programPriceLabel } from "@/lib/student/program-catalog";
import { formatCountLabel } from "@/lib/space/vocabulary";
import { cn } from "@/lib/utils";

export function StudentProgramsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vocabulary: v, category } = useSpaceVocabulary();
  const ProgramIcon = v.programIcon;
  const { space } = useStudentSpace();
  const [programs, setPrograms] = useState<StudentProgramResponse[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [catalog, workoutList] = await Promise.all([
        memberApi.myPrograms(),
        memberApi.myWorkouts().catch(() => [] as WorkoutResponse[]),
      ]);
      setPrograms(catalog);
      setWorkouts(workoutList);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar programas.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enrolledCount = programs.filter((p) => p.enrolled).length;
  const subtitle =
    programs.length === 0
      ? `Seu coach ainda não publicou ${v.program.plural} neste espaço.`
      : enrolledCount > 0
        ? `${formatCountLabel(programs.length, v.program.singular, v.program.plural)} · ${enrolledCount} matriculado(s)`
        : `${formatCountLabel(programs.length, v.program.singular, v.program.plural)} disponível(is)`;

  const handleEnroll = async (program: StudentProgramResponse) => {
    if (!canEnrollFree(program)) return;
    setEnrollingId(program.id);
    try {
      await memberApi.enrollProgram(program.id);
      toast(v.enrollToast);
      navigate("/student");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível matricular.", "error");
    } finally {
      setEnrollingId(null);
    }
  };

  const handlePurchase = async (program: StudentProgramResponse) => {
    if (!canPurchasePaid(program)) return;
    setPurchasingId(program.id);
    try {
      const result = await startProgramCheckout(program.id);
      if (!result.ok) {
        toast(result.error ?? "Não foi possível iniciar a compra.", "error");
        return;
      }
      if (result.redirected) return;
      toast(result.message ?? "Compra iniciada — aguarde a confirmação.");
      void load();
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 motion-safe:animate-in motion-safe:fade-in md:pb-8">
      <header className="flex flex-col gap-3 px-1 pt-1">
        {space ? <StudentSpaceHero space={space} /> : null}
        <div>
          <h1 className="text-[23px] font-extrabold tracking-tight">{v.programsNav}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </header>

      <PanelState
        state={state === "content" && programs.length === 0 ? "empty" : state}
        message={error}
        onRetry={load}
        emptyVariant="student"
      >
        <ul className="flex list-none flex-col gap-3.5 p-0">
          {programs.map((program, index) => {
            const priceLabel = programPriceLabel(program);
            const enrolling = enrollingId === program.id;
            const purchasing = purchasingId === program.id;

            return (
              <li key={program.id}>
                <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  <div
                    className="h-[3px]"
                    style={{ background: PROGRAM_ACCENT_BARS[index % PROGRAM_ACCENT_BARS.length] }}
                    aria-hidden
                  />
                  <div className="space-y-3.5 p-[18px]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-primary/25 bg-primary/10">
                          <ProgramIcon className="size-4 text-primary" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-extrabold leading-tight tracking-tight">
                            {program.title}
                          </h2>
                          {program.description ? (
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {program.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                          program.paid
                            ? "border-amber-500/35 bg-amber-500/10 text-amber-400"
                            : "border-primary/35 bg-primary/10 text-primary",
                        )}
                      >
                        {priceLabel}
                      </span>
                    </div>

                    {program.purchasePending ? (
                      <Alert>
                        <AlertDescription>Pagamento pendente — aguarde a confirmação.</AlertDescription>
                      </Alert>
                    ) : null}

                    {program.enrolled ? (
                      <div className="space-y-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                          <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          Matriculado
                        </span>
                        <ProgramWorkoutList
                          programId={program.id}
                          workouts={workouts}
                          expanded={expandedProgramId === program.id}
                          onToggle={() =>
                            setExpandedProgramId((current) =>
                              current === program.id ? null : program.id,
                            )
                          }
                        />
                        {category === "NUTRITION" && program.nutritionStructured ? (
                          <Button
                            variant="outline"
                            className="w-full rounded-[12px]"
                            onClick={() => navigate(`/student/programs/${program.id}/nutrition`)}
                          >
                            Ver plano com macros
                          </Button>
                        ) : null}
                      </div>
                    ) : program.paid ? (
                      <Button
                        size="lg"
                        className="h-12 w-full rounded-[12px] font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)]"
                        disabled={!canPurchasePaid(program) || purchasing}
                        onClick={() => void handlePurchase(program)}
                      >
                        <CreditCard className="size-4" aria-hidden />
                        {purchasing ? "Redirecionando…" : `Comprar · ${priceLabel}`}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="h-12 w-full rounded-[12px] font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)]"
                        disabled={!canEnrollFree(program) || enrolling}
                        onClick={() => void handleEnroll(program)}
                      >
                        <ProgramIcon className="size-4" aria-hidden />
                        {enrolling ? "Matriculando…" : "Matricular grátis"}
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </PanelState>

      <p className="text-center text-[11px] text-muted-foreground">
        Sugestão, não orientação médica/profissional.
      </p>
    </div>
  );
}
