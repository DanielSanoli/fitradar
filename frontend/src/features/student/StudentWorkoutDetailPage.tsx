import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, Check, ChevronLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckInCelebrationOverlay } from "@/components/student/CheckInCelebrationOverlay";
import { CheckInSheet } from "@/components/student/CheckInSheet";
import { WorkoutExerciseList } from "@/components/student/WorkoutExerciseList";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { memberApi } from "@/lib/api/member-api";
import type { CheckInResponse, WorkoutResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { localDateKey } from "@/lib/student/date-utils";
import { countExercises } from "@/lib/student/workout-content";
import { cn } from "@/lib/utils";

export function StudentWorkoutDetailPage() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(3);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateStreak, setCelebrateStreak] = useState(0);

  const today = localDateKey();
  const workout = workouts.find((w) => w.id === workoutId) ?? null;

  usePageTitle(workout?.title ?? null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [workoutList, checkInPage, progress] = await Promise.all([
        memberApi.myWorkouts(),
        memberApi.myCheckIns(0, 100),
        memberApi.myProgress(),
      ]);
      setWorkouts(workoutList);
      setCheckIns(checkInPage.content);
      setState("content");
      return progress;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar treino.");
      setState("error");
      return null;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const doneToday = useMemo(
    () =>
      checkIns.some(
        (c) => c.workoutId === workoutId && c.date === today && c.status === "DONE",
      ),
    [checkIns, workoutId, today],
  );

  const exTotal = workout ? countExercises(workout.contentMarkdown) : 0;
  const hasExercises = exTotal > 0 || Boolean(workout?.contentMarkdown?.trim());

  const finishCheckIn = async (skipped: boolean) => {
    setSheetOpen(false);
    const progress = await load();
    if (!skipped && progress) {
      setCelebrateStreak(progress.currentStreak);
      setCelebrate(true);
    }
  };

  const submitCheckIn = async (skipped: boolean) => {
    if (!workout) return;
    const hasSensitive = (!skipped && rating != null) || notes.trim().length > 0;
    if (hasSensitive && !consent) {
      toast("Marque o consentimento para compartilhar sensação ou notas.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await memberApi.createCheckIn({
        workoutId: workout.id,
        skipped,
        feeling: skipped || rating == null ? null : rating,
        notes: notes.trim() || null,
      });
      toast(skipped ? "Treino marcado como pulado." : "Check-in registrado!");
      await finishCheckIn(skipped);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro no check-in.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const quickCheckIn = async () => {
    if (!workout || doneToday) return;
    setSubmitting(true);
    try {
      await memberApi.createCheckIn({
        workoutId: workout.id,
        skipped: false,
        feeling: null,
        notes: null,
      });
      toast("Check-in registrado!");
      await finishCheckIn(false);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro no check-in.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openCheckInSheet = () => {
    if (!workout) return;
    setRating(3);
    setNotes("");
    setConsent(false);
    setSheetOpen(true);
  };

  const notFound = state === "content" && workoutId && !workout;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 motion-safe:animate-in motion-safe:fade-in md:pb-8">
      <CheckInCelebrationOverlay
        show={celebrate}
        streak={celebrateStreak}
        onClose={() => setCelebrate(false)}
      />

      <header className="px-1 pt-1">
        <Button variant="outline" size="sm" asChild className="mb-3 h-9 w-fit gap-2 rounded-[9px]">
          <Link to="/student">
            <ChevronLeft className="size-4" aria-hidden />
            Início
          </Link>
        </Button>
      </header>

      <PanelState
        state={notFound ? "empty" : state}
        message={notFound ? "Treino não encontrado ou você não está matriculado." : error}
        onRetry={load}
        emptyVariant="student"
      >
        {workout ? (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
              <div className="h-[3px] bg-gradient-to-r from-primary to-primary/70" aria-hidden />
              <div className="space-y-3 p-[18px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Treino
                  </span>
                  {doneToday ? (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                      Concluído hoje
                    </span>
                  ) : null}
                </div>

                <div>
                  <h1 className="text-[23px] font-extrabold leading-tight tracking-tight">
                    {workout.title}
                  </h1>
                  {workout.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{workout.description}</p>
                  ) : null}
                </div>

                {hasExercises ? (
                  <WorkoutExerciseList
                    contentMarkdown={workout.contentMarkdown}
                    className="space-y-2"
                  />
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Seu criador ainda não publicou o conteúdo deste treino.
                  </p>
                )}

                <div className="flex items-center gap-3 border-t border-border/80 pt-2.5 text-xs text-muted-foreground">
                  <span>{exTotal > 0 ? `${exTotal} exercícios` : "Conteúdo do treino"}</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              disabled={doneToday || submitting}
              onClick={() => void quickCheckIn()}
              className={cn(
                "h-14 gap-2.5 rounded-[14px] text-base font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)]",
                doneToday &&
                  "border border-primary/35 bg-primary/10 text-primary shadow-none hover:bg-primary/10",
              )}
            >
              {doneToday ? (
                <Check className="size-5" strokeWidth={3} aria-hidden />
              ) : (
                <CalendarCheck className="size-5" strokeWidth={2.5} aria-hidden />
              )}
              {doneToday ? "Treino concluído hoje" : "Registrar check-in"}
            </Button>

            {!doneToday ? (
              <button
                type="button"
                onClick={openCheckInSheet}
                disabled={submitting}
                className="text-center text-sm font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                Como me senti? (opcional)
              </button>
            ) : null}

            <Button variant="outline" className="rounded-[12px]" onClick={() => navigate("/student/history")}>
              Ver histórico de check-ins
            </Button>
          </>
        ) : null}
      </PanelState>

      <CheckInSheet
        open={sheetOpen}
        workoutTitle={workout?.title ?? ""}
        rating={rating}
        notes={notes}
        consent={consent}
        submitting={submitting}
        onOpenChange={setSheetOpen}
        onRatingChange={setRating}
        onNotesChange={setNotes}
        onConsentChange={setConsent}
        onConfirm={() => void submitCheckIn(false)}
        onSkip={() => void submitCheckIn(true)}
      />

      <p className="text-center text-[11px] text-muted-foreground">
        Sugestão, não orientação médica/profissional.
      </p>
    </div>
  );
}
