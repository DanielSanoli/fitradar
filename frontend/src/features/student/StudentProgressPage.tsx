import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Flame, History, Images, Sparkles, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { AdherenceRing } from "@/components/fitness/AdherenceRing";
import { StudentCommunityRanking } from "@/components/student/StudentCommunityRanking";
import { StreakShieldsBadge } from "@/components/student/StreakShieldsBadge";
import { WeeklyActivityChart } from "@/components/student/WeeklyActivityChart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PushSettingsCard } from "@/components/pwa/PushPrompt";
import { PanelState } from "@/components/ui/PanelState";
import { StaggerItem } from "@/components/motion/StaggerList";
import { useRadarCopilot } from "@/features/radar/RadarCopilotProvider";
import { memberApi } from "@/lib/api/member-api";
import type {
  CheckInResponse,
  GamificationProfileResponse,
  LeaderboardEntryResponse,
  StudentProgramResponse,
  StudentProgressResult,
  WorkoutResponse,
} from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/hooks/useAuth";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import {
  getProgressMilestones,
  weekSummaryLabel,
} from "@/lib/space/vocabulary";
import { deriveProgressViewMode } from "@/lib/student/student-view-state";
import {
  adherenceLabelFromDto,
  adherenceRingColor,
} from "@/lib/student/student-copy";
import { buildWeekBars } from "@/lib/student/weekly-activity";
import { countExercises } from "@/lib/student/workout-content";
import { cn } from "@/lib/utils";

function blockErrorMessage(reason: unknown): string {
  return reason instanceof ApiError ? reason.message : "Indisponível no momento.";
}

export function StudentProgressPage() {
  const { user } = useAuth();
  const { vocabulary: v } = useSpaceVocabulary();
  const { openWidget, ask, suggestions } = useRadarCopilot();
  const [progress, setProgress] = useState<StudentProgressResult | null>(null);
  const [gamification, setGamification] = useState<GamificationProfileResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryResponse[]>([]);
  const [leaderboardState, setLeaderboardState] = useState<"loading" | "error" | "content">("loading");
  const [leaderboardError, setLeaderboardError] = useState<string>();
  const [checkIns, setCheckIns] = useState<CheckInResponse[]>([]);
  const [programs, setPrograms] = useState<StudentProgramResponse[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [gamificationWarning, setGamificationWarning] = useState<string>();

  const load = useCallback(async () => {
    setState("loading");
    setGamificationWarning(undefined);
    const [pResult, gResult, ciResult, progResult, wResult, lbResult] = await Promise.allSettled([
      memberApi.myProgress(),
      memberApi.myGamification(),
      memberApi.myCheckIns().then((r) => r.content),
      memberApi.myPrograms(),
      memberApi.myWorkouts(),
      memberApi.myLeaderboard(20),
    ]);

    if (pResult.status === "rejected") {
      setError(blockErrorMessage(pResult.reason));
      setState("error");
      return;
    }

    setProgress(pResult.value);
    setCheckIns(ciResult.status === "fulfilled" ? ciResult.value : []);
    setPrograms(progResult.status === "fulfilled" ? progResult.value : []);
    setWorkouts(wResult.status === "fulfilled" ? wResult.value : []);

    if (gResult.status === "fulfilled") {
      setGamification(gResult.value);
    } else {
      setGamification(null);
      setGamificationWarning(blockErrorMessage(gResult.reason));
    }

    if (lbResult.status === "fulfilled") {
      setLeaderboard(lbResult.value);
      setLeaderboardState("content");
      setLeaderboardError(undefined);
    } else {
      setLeaderboard([]);
      setLeaderboardState("error");
      setLeaderboardError(blockErrorMessage(lbResult.reason));
    }

    setState("content");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const bars = useMemo(() => buildWeekBars(checkIns), [checkIns]);
  const summary = useMemo(
    () => weekSummaryLabel(progress?.weeklyDone, v),
    [progress?.weeklyDone, v],
  );
  const milestonesSource = useMemo(() => getProgressMilestones(v), [v]);

  const enrolledProgram = programs.find((p) => p.enrolled);
  const totalDoneFromGamification = gamification?.totalCheckInsDone ?? null;
  const totalDoneFallback = checkIns.filter((c) => c.status === "DONE").length;
  const totalDone = totalDoneFromGamification ?? totalDoneFallback;
  const streak = progress?.currentStreak ?? 0;
  const showEarly = useMemo(
    () =>
      progress
        ? deriveProgressViewMode(totalDoneFromGamification, progress.adherence) === "early"
        : false,
    [progress, totalDoneFromGamification],
  );
  const ringColor = adherenceRingColor(progress?.adherence ?? null);
  const statusLabel = adherenceLabelFromDto(progress?.adherence ?? null);

  const nextWorkout = workouts.find((w) => w.id === progress?.nextWorkoutId);
  const nextExCount = nextWorkout ? countExercises(nextWorkout.contentMarkdown) : 0;
  const programWorkoutCount = workouts.length;
  const programBarWidth =
    programWorkoutCount > 0 && totalDoneFromGamification != null
      ? `${Math.min(100, Math.round((totalDoneFromGamification / programWorkoutCount) * 100))}%`
      : programWorkoutCount > 0 && totalDone > 0
        ? `${Math.min(100, Math.round((totalDone / programWorkoutCount) * 100))}%`
        : "0%";

  const milestones = milestonesSource.map((m) => {
    const done = m.streak ? streak >= m.thresh : totalDone >= m.thresh;
    const remaining = m.streak
      ? `${Math.max(0, m.thresh - streak)} dias restantes`
      : `${Math.max(0, m.thresh - totalDone)} ${v.itemsRemaining}`;
    return { ...m, done, remaining };
  });

  const askRadar = (question: string) => {
    openWidget();
    void ask(question);
  };

  const streakShields =
    gamification?.streakShields ?? progress?.streakShields ?? 0;
  const shieldEarnProgress =
    gamification?.shieldEarnProgress ?? progress?.shieldEarnProgress ?? 0;

  const firstName = progress?.studentName?.split(" ")[0] ?? "Aluno";

  const recapLink = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `/student/recap?year=${d.getFullYear()}&month=${d.getMonth() + 1}`;
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 md:pb-8">
      <header className="px-1">
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="inline-flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight">
            <span
              className="size-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
              aria-hidden
            />
            FitRadar
          </span>
          <span className="text-[13.5px] font-bold text-foreground/90">Meu Progresso</span>
          <span className="size-9" aria-hidden />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">
          {showEarly ? "Você está começando!" : `Boa semana, ${firstName}!`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {showEarly
            ? "Cada treino conta — o gráfico vai crescer com você."
            : "Veja sua evolução no programa."}
        </p>
      </header>

      <PanelState
        state={state}
        message={error}
        onRetry={load}
        emptyVariant="student"
        skeletonVariant="student-home"
        iconContext="activity"
      >
        {progress ? (
          <>
            {gamificationWarning ? (
              <Alert>
                <AlertDescription>
                  Conquistas temporariamente indisponíveis: {gamificationWarning}
                </AlertDescription>
              </Alert>
            ) : null}

            <Link
              to="/student/evolution"
              className="flex items-center gap-3 rounded-[18px] border border-border bg-card px-4 py-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.28)] transition-colors hover:border-primary/35"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
                <Images className="size-5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Minha evolução</p>
                <p className="text-xs text-muted-foreground">
                  Timeline privada de fotos, peso e comparador antes/depois.
                </p>
              </div>
            </Link>

            <Link
              to={recapLink}
              className="flex items-center gap-3 rounded-[18px] border border-primary/30 bg-gradient-to-br from-primary/10 to-card px-4 py-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.28)] transition-colors hover:border-primary/45"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
                <Sparkles className="size-5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Sua retrospectiva mensal</p>
                <p className="text-xs text-muted-foreground">
                  Veja seus números do mês anterior e compartilhe o card.
                </p>
              </div>
            </Link>

            {!showEarly ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center gap-2 rounded-[18px] border border-border bg-card px-3.5 py-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Aderência
                    </span>
                    <AdherenceRing
                      value={progress.adherence}
                      size="compact"
                      periodLabel="este mês"
                      statusLabel={statusLabel}
                      strokeColor={ringColor}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-1 flex-col justify-between rounded-[18px] border border-primary/30 bg-gradient-to-br from-primary/15 to-card px-3.5 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                          Sequência
                        </span>
                        <StreakShieldsBadge
                          count={streakShields}
                          earnProgress={shieldEarnProgress}
                          compact
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Flame
                            className={cn(
                              "size-5 shrink-0",
                              streak > 0 ? "text-flame streak-flame-pulse" : "text-muted-foreground",
                            )}
                            aria-hidden
                          />
                          <p className="text-[30px] font-extrabold leading-none text-primary tabular-nums">
                            {streak}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">dias seguidos</p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between rounded-[18px] border border-border bg-card px-3.5 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Concluídos
                      </span>
                      <div>
                        <p className="text-[30px] font-extrabold leading-none tabular-nums">
                          {totalDoneFromGamification != null ? totalDone : "—"}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">treinos no total</p>
                      </div>
                    </div>
                  </div>
                </div>

                <WeeklyActivityChart bars={bars} summary={summary} />

                {enrolledProgram ? (
                  <div className="space-y-3 rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">Programa atual</span>
                      {programWorkoutCount > 0 && totalDoneFromGamification != null ? (
                        <span className="text-xs font-bold text-primary">{programBarWidth} completo</span>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold">{enrolledProgram.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {totalDone === 1 ? "1 treino feito" : `${totalDone} treinos feitos`}
                        {programWorkoutCount > 0 ? ` · ${programWorkoutCount} no programa` : ""}
                      </p>
                    </div>
                    {programWorkoutCount > 0 ? (
                      <div
                        className="h-2 overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-valuenow={
                          totalDoneFromGamification != null
                            ? Math.min(100, Math.round((totalDoneFromGamification / programWorkoutCount) * 100))
                            : 0
                        }
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Progresso no programa"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-[0_0_10px_hsl(var(--primary)/0.4)] transition-[width] duration-500 ease-out"
                          style={{ width: programBarWidth }}
                        />
                      </div>
                    ) : null}
                    {progress.nextWorkoutTitle ? (
                      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3.5 py-3">
                        <div className="flex size-9 items-center justify-center rounded-[10px] border border-primary/30 bg-primary/15">
                          <ClipboardList className="size-4 text-primary" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Próximo treino
                          </p>
                          <p className="truncate text-sm font-bold">{progress.nextWorkoutTitle}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          {nextWorkout ? "Hoje" : "Em breve"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {gamification && gamification.badges.length > 0 ? (
                  <div className="rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                    <h2 className="flex items-center gap-2 text-sm font-bold">
                      <Trophy className="size-4 text-primary" aria-hidden />
                      Conquistas
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {gamification.badges.map((b) => (
                        <span
                          key={`${b.type}-${b.earnedAt}`}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <StudentCommunityRanking
                  gamification={gamification}
                  leaderboard={leaderboard}
                  state={leaderboardState}
                  error={leaderboardError}
                  onRetry={load}
                  currentStudentId={user?.id}
                />

                {workouts.length > 0 ? (
                  <section className="rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                    <h2 className="text-sm font-bold">Todos os treinos</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Abra qualquer treino do programa e registre check-in.
                    </p>
                    <ul className="mt-3 space-y-2">
                      {workouts.map((workout, index) => (
                        <li key={workout.id}>
                          <StaggerItem index={index}>
                          <Link
                            to={`/student/workouts/${workout.id}`}
                            className="app-list-item-interactive flex items-center gap-3 rounded-[13px] border border-border bg-muted/20 px-3.5 py-3"
                          >
                            <ClipboardList className="size-4 shrink-0 text-primary/70" aria-hidden />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{workout.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {countExercises(workout.contentMarkdown) > 0
                                  ? `${countExercises(workout.contentMarkdown)} exercícios`
                                  : "Ver detalhes"}
                              </p>
                            </div>
                          </Link>
                          </StaggerItem>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <Button variant="outline" className="w-full rounded-[12px]" asChild>
                  <Link to="/student/history">
                    <History className="size-4" aria-hidden />
                    Ver histórico de check-ins
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-[20px] border border-primary/30 bg-gradient-to-br from-primary/15 to-card px-5 py-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.32)]">
                  <div className="relative mx-auto mb-4 flex size-[72px] items-center justify-center">
                    <span className="absolute size-[72px] rounded-full border border-primary/30" aria-hidden />
                    <span className="absolute size-[50px] rounded-full border border-primary/40" aria-hidden />
                    <span
                      className="absolute size-7 rounded-full border border-primary/50"
                      aria-hidden
                    />
                    <span
                      className="size-2.5 rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary))]"
                      aria-hidden
                    />
                  </div>
                  <h2 className="text-xl font-extrabold">O Radar está te observando!</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Conforme você treina, monto aqui seu gráfico de aderência, sequência e evolução.
                    Continue assim.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <div className="rounded-[14px] border border-border bg-muted/30 px-2.5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="size-4 text-flame streak-flame-pulse" aria-hidden />
                        <p className="text-2xl font-extrabold text-primary tabular-nums">{streak}</p>
                      </div>
                      <p className="text-[11px] font-semibold text-muted-foreground">dias seguidos</p>
                      <div className="mt-2 flex justify-center">
                        <StreakShieldsBadge
                          count={streakShields}
                          earnProgress={shieldEarnProgress}
                          compact
                        />
                      </div>
                    </div>
                    <div className="rounded-[14px] border border-border bg-muted/30 px-2.5 py-3.5">
                      <p className="text-2xl font-extrabold tabular-nums">{totalDone}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground">treinos feitos</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                  <h2 className="text-sm font-bold">Seus próximos marcos</h2>
                  <ul className="mt-3.5 space-y-3.5">
                    {milestones.map((m) => (
                      <li key={m.id} className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-8 items-center justify-center rounded-[9px] border",
                            m.done
                              ? "border-primary/30 bg-primary/15 text-primary"
                              : "border-border bg-secondary text-muted-foreground",
                          )}
                        >
                          <Zap className="size-3.5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              m.done ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {m.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{m.sub}</p>
                        </div>
                        {m.done ? (
                          <Check className="size-4 shrink-0 text-primary" strokeWidth={3} aria-hidden />
                        ) : (
                          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                            {m.remaining}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {nextWorkout ? (
                  <div className="flex items-center gap-3.5 rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                    <div className="flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
                      <ClipboardList className="size-5 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Próximo treino
                      </p>
                      <Link
                        to={`/student/workouts/${nextWorkout.id}`}
                        className="font-bold text-primary underline-offset-4 hover:underline"
                      >
                        {nextWorkout.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {nextExCount > 0 ? `${nextExCount} exercícios` : "Treino programado"}
                      </p>
                    </div>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      Hoje
                    </span>
                  </div>
                ) : null}

                <StudentCommunityRanking
                  gamification={gamification}
                  leaderboard={leaderboard}
                  state={leaderboardState}
                  error={leaderboardError}
                  onRetry={load}
                  currentStudentId={user?.id}
                />

                {workouts.length > 0 ? (
                  <section className="rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                    <h2 className="text-sm font-bold">Todos os treinos</h2>
                    <ul className="mt-3 space-y-2">
                      {workouts.map((workout, index) => (
                        <li key={workout.id}>
                          <StaggerItem index={index}>
                          <Link
                            to={`/student/workouts/${workout.id}`}
                            className="app-list-item-interactive flex items-center gap-3 rounded-[13px] border border-border bg-muted/20 px-3.5 py-3"
                          >
                            <ClipboardList className="size-4 shrink-0 text-primary/70" aria-hidden />
                            <span className="truncate text-sm font-semibold">{workout.title}</span>
                          </Link>
                          </StaggerItem>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <Button variant="outline" className="w-full rounded-[12px]" asChild>
                  <Link to="/student/history">
                    <History className="size-4" aria-hidden />
                    Ver histórico de check-ins
                  </Link>
                </Button>
              </>
            )}

            <div className="rounded-[18px] border border-primary/25 bg-gradient-to-br from-primary/10 to-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-[9px] border border-primary/30 bg-primary/15">
                  <span
                    className="size-2 rotate-45 rounded-sm bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="text-sm font-bold">Pergunte ao Radar</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {showEarly ? "Seu copiloto de treino" : "Insights sobre seu progresso"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {suggestions.slice(0, 3).map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    className="h-auto justify-start whitespace-normal border-primary/30 bg-primary/5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-primary/90 hover:bg-primary/10"
                    onClick={() => askRadar(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <PushSettingsCard />

            <p className="text-center text-[11px] text-muted-foreground">
              Sugestão, não orientação médica/profissional.
            </p>
          </>
        ) : null}
      </PanelState>
    </div>
  );
}
