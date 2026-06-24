import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BedDouble, CalendarCheck, Check, ChevronRight, Dumbbell, Flame } from "lucide-react";
import { CheckInCelebrationOverlay } from "@/components/student/CheckInCelebrationOverlay";
import { CheckInSheet } from "@/components/student/CheckInSheet";
import {
  HOME_VIEW_OPTIONS,
  StudentStatePreviewToggle,
  type StudentHomeViewMode,
} from "@/components/student/StudentStatePreviewToggle";
import { WorkoutExerciseList } from "@/components/student/WorkoutExerciseList";
import { CreatorSpaceBrand } from "@/components/fitness/CreatorSpaceBrand";
import { PushOptInBanner } from "@/components/pwa/PushPrompt";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { memberApi } from "@/lib/api/member-api";
import type {
  CheckInResponse,
  CreatorSpaceResponse,
  StudentProgressResult,
  StudentProgramResponse,
  WorkoutResponse,
} from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/hooks/useAuth";
import { formatGreetingDate, localDateKey } from "@/lib/student/date-utils";
import { streakSubtitle } from "@/lib/student/student-copy";
import { deriveHomeViewMode } from "@/lib/student/student-view-state";
import { countExercises } from "@/lib/student/workout-content";
import { cn } from "@/lib/utils";

const UPCOMING_LABELS = ["Amanhã", "Depois", "Em breve"] as const;

export function StudentHomePage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgressResult | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [programs, setPrograms] = useState<StudentProgramResponse[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInResponse[]>([]);
  const [space, setSpace] = useState<CreatorSpaceResponse | null>(null);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutResponse | null>(null);
  const [rating, setRating] = useState<number | null>(3);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateStreak, setCelebrateStreak] = useState(0);
  const [viewMode, setViewMode] = useState<StudentHomeViewMode>("workout");
  const [viewModeTouched, setViewModeTouched] = useState(false);
  const streakBeforeCheckIn = useRef(0);
  const { toast } = useToast();

  const today = localDateKey();
  const doneToday = useMemo(
    () =>
      new Set(
        checkIns
          .filter((c) => c.date === today && c.status === "DONE")
          .map((c) => c.workoutId),
      ),
    [checkIns, today],
  );

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [p, w, ci, spaceData, prog] = await Promise.all([
        memberApi.myProgress(),
        memberApi.myWorkouts(),
        memberApi.myCheckIns().then((r) => r.content),
        memberApi.mySpace().catch(() => null),
        memberApi.myPrograms().catch(() => [] as StudentProgramResponse[]),
      ]);
      setProgress(p);
      setWorkouts(w);
      setCheckIns(ci);
      setSpace(spaceData);
      setPrograms(prog);
      setState("content");
      return p;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar.");
      setState("error");
      return null;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (progress && !viewModeTouched) {
      setViewMode(deriveHomeViewMode(progress));
    }
  }, [progress, viewModeTouched]);

  const apiMode = deriveHomeViewMode(progress);
  const nextWorkout = workouts.find((w) => w.id === progress?.nextWorkoutId) ?? workouts[0];
  const displayWorkout =
    viewMode === "workout" ? nextWorkout ?? workouts[0] : nextWorkout;
  const firstName = user?.name?.split(" ")[0] ?? "Aluno";
  const enrolledProgram = programs.find((p) => p.enrolled);
  const programTitle = enrolledProgram?.title ?? space?.name ?? "FitRadar";

  const upcoming = useMemo(() => {
    if (!displayWorkout) return [];
    const idx = workouts.findIndex((w) => w.id === displayWorkout.id);
    return workouts.slice(idx + 1, idx + 4).map((w, i) => ({
      workout: w,
      dayLabel: UPCOMING_LABELS[i] ?? "Em breve",
      exCount: countExercises(w.contentMarkdown) || (w.description ? 1 : 0),
    }));
  }, [workouts, displayWorkout]);

  const finishCheckIn = async (skipped: boolean) => {
    if (!activeWorkout) return;
    setSheetOpen(false);
    setCheckInSuccess(true);
    if (!skipped) {
      const updated = await load();
      const newStreak = updated?.currentStreak ?? 0;
      setCelebrateStreak(newStreak);
      setCelebrate(true);
    } else {
      await load();
    }
  };

  const submitCheckIn = async (skipped: boolean) => {
    if (!activeWorkout) return;
    const hasSensitive = (!skipped && rating != null) || notes.trim().length > 0;
    if (hasSensitive && !consent) {
      toast("Marque o consentimento para compartilhar sensação ou notas.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await memberApi.createCheckIn({
        workoutId: activeWorkout.id,
        skipped,
        feeling: skipped || rating == null ? null : rating,
        notes: notes.trim() || null,
      });
      await finishCheckIn(skipped);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro no check-in.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const quickCheckIn = async () => {
    if (!nextWorkout || doneToday.has(nextWorkout.id)) return;
    streakBeforeCheckIn.current = progress?.currentStreak ?? 0;
    setActiveWorkout(nextWorkout);
    setSubmitting(true);
    try {
      await memberApi.createCheckIn({
        workoutId: nextWorkout.id,
        skipped: false,
        feeling: null,
        notes: null,
      });
      await finishCheckIn(false);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro no check-in.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openCheckInSheet = () => {
    if (!nextWorkout) return;
    streakBeforeCheckIn.current = progress?.currentStreak ?? 0;
    setActiveWorkout(nextWorkout);
    setRating(3);
    setNotes("");
    setConsent(false);
    setSheetOpen(true);
  };

  const todayDoneFlag = displayWorkout ? doneToday.has(displayWorkout.id) : false;
  const exTotal = displayWorkout ? countExercises(displayWorkout.contentMarkdown) : 0;
  const hasExercises =
    exTotal > 0 || Boolean(displayWorkout?.contentMarkdown?.trim());

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 motion-safe:animate-in motion-safe:fade-in md:pb-8">
      <CheckInCelebrationOverlay
        show={celebrate}
        streak={celebrateStreak}
        onClose={() => setCelebrate(false)}
      />

      <header className="px-1 pt-1">
        <CreatorSpaceBrand
          name={space?.name ?? "FitRadar"}
          logoUrl={space?.logoUrl}
          primaryColor={space?.primaryColor}
          category={space?.category}
          className="mb-3"
        />
        <h1 className="text-[23px] font-extrabold tracking-tight">Bom dia, {firstName}!</h1>
        <p className="text-sm capitalize text-muted-foreground">{formatGreetingDate()}</p>
      </header>

      {state === "content" && progress ? (
        <StudentStatePreviewToggle
          value={viewMode}
          options={HOME_VIEW_OPTIONS}
          onChange={(next) => {
            setViewModeTouched(true);
            setViewMode(next);
          }}
          className="px-1"
        />
      ) : null}

      <PanelState state={state} message={error} onRetry={load} emptyVariant="student">
        {progress ? (
          <>
            <div className="flex items-center gap-3.5 rounded-[14px] border border-primary/30 bg-gradient-to-br from-primary/15 to-card px-4 py-3.5">
              <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[13px] border border-primary/30 bg-primary/15">
                <Flame className="size-[22px] text-flame streak-flame-pulse" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-extrabold leading-none text-primary tabular-nums">
                    {progress.currentStreak}
                  </span>
                  <span className="text-sm font-semibold">dias seguidos</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {streakSubtitle(progress.currentStreak, progress.message)}
                </p>
              </div>
            </div>

            {viewMode === "workout" && displayWorkout ? (
              <div className="flex flex-col gap-3.5">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  <div className="h-[3px] bg-gradient-to-r from-primary to-primary/70" aria-hidden />
                  <div className="space-y-3 p-[18px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Hoje
                      </span>
                      <span className="size-1 rounded-full bg-muted-foreground/40" aria-hidden />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {programTitle}
                      </span>
                      {todayDoneFlag ? (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                          <Check className="size-3" strokeWidth={3} aria-hidden />
                          Concluído
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h2 className="text-[21px] font-extrabold leading-tight tracking-tight">
                        {displayWorkout.title}
                      </h2>
                      {displayWorkout.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{displayWorkout.description}</p>
                      ) : null}
                    </div>

                    {hasExercises ? (
                      <WorkoutExerciseList
                        contentMarkdown={displayWorkout.contentMarkdown}
                        className="space-y-2"
                      />
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Seu criador ainda não publicou o conteúdo deste treino.
                      </p>
                    )}

                    <div className="flex items-center gap-3 border-t border-border/80 pt-2.5 text-xs text-muted-foreground">
                      <span>{exTotal > 0 ? `${exTotal} exercícios` : "Treino do dia"}</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  disabled={todayDoneFlag || submitting || !nextWorkout || viewMode !== apiMode}
                  onClick={() => void quickCheckIn()}
                  className={cn(
                    "h-14 gap-2.5 rounded-[14px] text-base font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)]",
                    todayDoneFlag &&
                      "border border-primary/35 bg-primary/10 text-primary shadow-none hover:bg-primary/10",
                  )}
                >
                  {todayDoneFlag ? (
                    <Check className="size-5" strokeWidth={3} aria-hidden />
                  ) : (
                    <CalendarCheck className="size-5" strokeWidth={2.5} aria-hidden />
                  )}
                  {todayDoneFlag ? "Treino concluído hoje" : "Treino feito!"}
                </Button>

                {!todayDoneFlag && nextWorkout && viewMode === apiMode ? (
                  <button
                    type="button"
                    onClick={openCheckInSheet}
                    disabled={submitting}
                    className="text-center text-sm font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Como me senti? (opcional)
                  </button>
                ) : null}
              </div>
            ) : viewMode === "workout" ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum treino disponível para exibir neste estado.
              </p>
            ) : null}

            {viewMode === "rest" ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                <div className="h-[3px] bg-gradient-to-r from-violet-500 to-violet-400/70" aria-hidden />
                <div className="flex flex-col items-center gap-4 px-[18px] py-6 text-center">
                  <div className="flex size-[58px] items-center justify-center rounded-[18px] border border-violet-500/30 bg-violet-500/15">
                    <BedDouble className="size-7 text-violet-400" strokeWidth={1.8} aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">Dia de descanso</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {progress.message ??
                        "Você treinou recentemente — hoje é hora de recuperar. Cuide do sono e da hidratação."}
                    </p>
                  </div>
                  <div className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Sugestão
                    </p>
                    <p className="mt-1 text-sm text-foreground/90">
                      10 min de alongamento ou caminhada leve
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {viewMode === "none" ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                <div className="h-[3px] bg-gradient-to-r from-amber-400 to-amber-300/70" aria-hidden />
                <div className="flex flex-col items-center gap-5 px-[18px] py-7 text-center">
                  <div className="relative flex size-[68px] items-center justify-center">
                    <span className="absolute size-[68px] rounded-full border border-primary/25" aria-hidden />
                    <span className="absolute size-11 rounded-full border border-primary/35" aria-hidden />
                    <span
                      className="size-2.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
                      aria-hidden
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">Nenhum programa ainda</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {progress.message ??
                        "Você ainda não está matriculado. Fale com seu coach para começar."}
                    </p>
                  </div>
                  <p className="w-full rounded-[11px] border border-dashed border-border bg-muted/30 px-3.5 py-3 text-left text-xs leading-relaxed text-muted-foreground">
                    Quando seu coach criar um programa e te matricular, ele aparece aqui na hora.
                  </p>
                </div>
              </div>
            ) : null}

            {(viewMode === "workout" || viewMode === "rest") && upcoming.length > 0 ? (
              <section className="space-y-2.5" aria-label="Próximos treinos">
                <h2 className="text-sm font-bold text-foreground/90">Próximos treinos</h2>
                <ul className="space-y-2">
                  {upcoming.map(({ workout, dayLabel, exCount }) => (
                    <li
                      key={workout.id}
                      className="flex items-center gap-3 rounded-[13px] border border-border bg-card/80 px-3.5 py-3"
                    >
                      <span className="inline-flex min-w-[52px] items-center justify-center rounded-lg border border-border bg-secondary px-2 py-1 text-[11.5px] font-bold text-muted-foreground">
                        {dayLabel}
                      </span>
                      <Dumbbell className="size-4 shrink-0 text-primary/70" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{workout.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {exCount > 0 ? `${exCount} exercícios` : "Treino programado"}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <PushOptInBanner show={checkInSuccess} />

            <p className="text-center text-[11px] text-muted-foreground">
              Sugestão, não orientação médica/profissional.
            </p>
          </>
        ) : null}
      </PanelState>

      <CheckInSheet
        open={sheetOpen}
        workoutTitle={activeWorkout?.title ?? ""}
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
    </div>
  );
}
