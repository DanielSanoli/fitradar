import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CalendarCheck, Check, ChevronLeft, Dumbbell } from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { CheckInCelebrationOverlay } from "@/components/student/CheckInCelebrationOverlay";

import { CheckInSheet } from "@/components/student/CheckInSheet";

import { WorkoutExerciseList } from "@/components/student/WorkoutExerciseList";

import { WorkoutPlayer } from "@/components/student/WorkoutPlayer";

import { Button } from "@/components/ui/button";

import { PanelState } from "@/components/ui/PanelState";

import { useToast } from "@/components/ui/toast";

import { usePageTitle } from "@/hooks/usePageTitle";

import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";

import { formatItemContentCount, capitalizeLabel } from "@/lib/space/vocabulary";

import { memberApi } from "@/lib/api/member-api";

import type {
  CheckInResponse,
  GamificationProfileResponse,
  StudentProgressResult,
  WorkoutResponse,
} from "@/lib/api/domain-types";

import { ApiError } from "@/lib/api/types";

import { localDateKey } from "@/lib/student/date-utils";

import { resolveCheckInCelebrationMessage } from "@/lib/student/check-in-celebration";

import {

  cacheWorkoutsForOffline,

  getCachedWorkout,

  loadWorkoutSession,

} from "@/lib/student/workout-player-session";

import { countExercises } from "@/lib/student/workout-content";

import { cn } from "@/lib/utils";



export function StudentWorkoutDetailPage() {

  const { workoutId } = useParams();

  const navigate = useNavigate();

  const { toast } = useToast();

  const { vocabulary: v } = useSpaceVocabulary();



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

  const [celebrationCopy, setCelebrationCopy] = useState({

    headline: "Treino registrado!",

    subtitle: "Bom trabalho. Cada treino conta.",

    streak: 0,

  });

  const [playerOpen, setPlayerOpen] = useState(false);

  const [gamification, setGamification] = useState<GamificationProfileResponse | null>(null);
  const [progress, setProgress] = useState<StudentProgressResult | null>(null);



  const streakBeforeCheckIn = useRef(0);

  const longestStreakBeforeCheckIn = useRef(0);

  const weeklyDoneBeforeCheckIn = useRef(0);

  const totalCheckInsBeforeCheckIn = useRef(0);



  const today = localDateKey();

  const workout = workouts.find((w) => w.id === workoutId) ?? null;



  usePageTitle(workout?.title ?? null);



  const load = useCallback(async () => {

    setState("loading");

    try {

      const [workoutList, checkInPage, progress, g] = await Promise.all([

        memberApi.myWorkouts(),

        memberApi.myCheckIns(0, 100),

        memberApi.myProgress(),

        memberApi.myGamification().catch(() => null),

      ]);

      setWorkouts(workoutList);

      cacheWorkoutsForOffline(workoutList);

      setCheckIns(checkInPage.content);

      setGamification(g);

      setProgress(progress);

      setState("content");

      return progress;

    } catch (e) {

      const cached = workoutId ? getCachedWorkout(workoutId) : null;

      if (cached) {

        setWorkouts([cached as WorkoutResponse]);

        setState("content");

        return null;

      }

      setError(e instanceof ApiError ? e.message : v.itemLoadError);

      setState("error");

      return null;

    }

  }, [workoutId, v.itemLoadError]);



  useEffect(() => {

    void load();

  }, [load]);



  useEffect(() => {

    if (workoutId && loadWorkoutSession(workoutId)) {

      setPlayerOpen(true);

    }

  }, [workoutId]);



  const doneToday = useMemo(

    () =>

      checkIns.some(

        (c) => c.workoutId === workoutId && c.date === today && c.status === "DONE",

      ),

    [checkIns, workoutId, today],

  );



  const exTotal = workout ? countExercises(workout.contentMarkdown) : 0;

  const hasExercises = exTotal > 0 || Boolean(workout?.contentMarkdown?.trim());

  const canStartPlayer = hasExercises && !doneToday;



  const capturePreCheckInSnapshot = () => {

    streakBeforeCheckIn.current = progress?.currentStreak ?? 0;

    longestStreakBeforeCheckIn.current = gamification?.longestStreak ?? 0;

    weeklyDoneBeforeCheckIn.current = progress?.weeklyDone ?? 0;

    totalCheckInsBeforeCheckIn.current = gamification?.totalCheckInsDone ?? 0;

  };



  const finishCheckIn = async (skipped: boolean, created?: CheckInResponse) => {

    setSheetOpen(false);

    const progress = await load();

    if (!skipped && progress) {

      let latestGamification = gamification;

      try {

        latestGamification = await memberApi.myGamification();

        setGamification(latestGamification);

      } catch {

        // mantém gamificação anterior

      }



      const currentStreak = progress.currentStreak ?? 0;

      const copy = resolveCheckInCelebrationMessage({

        currentStreak,

        longestStreak: latestGamification?.longestStreak ?? currentStreak,

        totalCheckInsDone: latestGamification?.totalCheckInsDone ?? 0,

        weeklyDone: progress.weeklyDone ?? 0,

        shieldEarned: created?.shieldEarned ?? false,

        shieldConsumed: created?.shieldConsumed ?? false,

        before: {

          streak: streakBeforeCheckIn.current,

          longestStreak: longestStreakBeforeCheckIn.current,

          weeklyDone: weeklyDoneBeforeCheckIn.current,

          totalCheckInsDone: totalCheckInsBeforeCheckIn.current,

        },

      });

      setCelebrationCopy({

        headline: copy.headline,

        subtitle: copy.subtitle,

        streak: currentStreak,

      });

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

    capturePreCheckInSnapshot();

    setSubmitting(true);

    try {

      const created = await memberApi.createCheckIn({

        workoutId: workout.id,

        skipped,

        feeling: skipped || rating == null ? null : rating,

        notes: notes.trim() || null,

      });

      toast(skipped ? v.checkInSkipped : v.checkInRegistered);

      await finishCheckIn(skipped, created);

    } catch (e) {

      toast(e instanceof ApiError ? e.message : "Erro no check-in.", "error");

    } finally {

      setSubmitting(false);

    }

  };



  const quickCheckIn = async () => {

    if (!workout || doneToday) return;

    capturePreCheckInSnapshot();

    setSubmitting(true);

    try {

      const created = await memberApi.createCheckIn({

        workoutId: workout.id,

        skipped: false,

        feeling: null,

        notes: null,

      });

      toast(v.checkInRegistered);

      await finishCheckIn(false, created);

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



  const openPlayer = () => {

    if (!workout || !canStartPlayer) return;

    setPlayerOpen(true);

  };



  const handlePlayerFinish = () => {

    setPlayerOpen(false);

    capturePreCheckInSnapshot();

    openCheckInSheet();

  };



  const notFound = state === "content" && workoutId && !workout;



  return (

    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 motion-safe:animate-in motion-safe:fade-in md:pb-8">

      {playerOpen && workout ? (

        <WorkoutPlayer

          workoutId={workout.id}

          workoutTitle={workout.title}

          contentMarkdown={workout.contentMarkdown ?? ""}

          onFinish={handlePlayerFinish}

          onClose={() => setPlayerOpen(false)}

        />

      ) : null}



      <CheckInCelebrationOverlay

        show={celebrate}

        streak={celebrationCopy.streak}

        headline={celebrationCopy.headline}

        subtitle={celebrationCopy.subtitle}

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

        message={notFound ? v.itemNotFound : error}

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

                    {capitalizeLabel(v.item.singular)}

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

                    {v.noItemContent}

                  </p>

                )}



                <div className="flex items-center gap-3 border-t border-border/80 pt-2.5 text-xs text-muted-foreground">

                  <span>

                    {exTotal > 0

                      ? formatItemContentCount(exTotal, v)

                      : `Conteúdo da ${v.item.singular}`}

                  </span>

                </div>

              </div>

            </div>



            {canStartPlayer ? (

              <Button

                size="lg"

                onClick={openPlayer}

                className="h-14 gap-2.5 rounded-[14px] text-base font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)]"

              >

                <Dumbbell className="size-5" strokeWidth={2.5} aria-hidden />

                Iniciar treino

              </Button>

            ) : null}



            <Button

              size="lg"

              disabled={doneToday || submitting}

              onClick={() => void quickCheckIn()}

              variant={canStartPlayer ? "outline" : "default"}

              className={cn(

                "h-14 gap-2.5 rounded-[14px] text-base font-bold",

                !canStartPlayer &&

                  !doneToday &&

                  "shadow-[0_6px_20px_hsl(var(--primary)/0.36)]",

                doneToday &&

                  "border border-primary/35 bg-primary/10 text-primary shadow-none hover:bg-primary/10",

              )}

            >

              {doneToday ? (

                <Check className="size-5" strokeWidth={3} aria-hidden />

              ) : (

                <CalendarCheck className="size-5" strokeWidth={2.5} aria-hidden />

              )}

              {doneToday ? v.checkInDoneToday : v.checkInAction}

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

