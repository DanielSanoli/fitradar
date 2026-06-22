import { useCallback, useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { PushOptInBanner } from "@/components/pwa/PushPrompt";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PanelState } from "@/components/ui/PanelState";
import { memberApi } from "@/lib/api/member-api";
import type {
  CheckInResponse,
  StudentProgressResult,
  WorkoutResponse,
} from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/hooks/useAuth";

type HomeMode = "workout" | "rest" | "none";

function deriveMode(progress: StudentProgressResult | null): HomeMode {
  if (!progress?.enrolled) return "none";
  if (progress.nextWorkoutTitle) return "workout";
  return "rest";
}

export function StudentHomePage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgressResult | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInResponse[]>([]);
  const [spaceName, setSpaceName] = useState<string>();
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutResponse | null>(null);
  const [feeling, setFeeling] = useState("3");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
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
      const [p, w, ci, space] = await Promise.all([
        memberApi.myProgress(),
        memberApi.myWorkouts(),
        memberApi.myCheckIns().then((r) => r.content),
        memberApi.mySpace().catch(() => null),
      ]);
      setProgress(p);
      setWorkouts(w);
      setCheckIns(ci);
      if (space?.name) setSpaceName(space.name);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mode = deriveMode(progress);
  const nextWorkout = workouts.find((w) => w.id === progress?.nextWorkoutId) ?? workouts[0];
  const firstName = user?.name?.split(" ")[0] ?? "Aluno";

  const openCheckIn = (workout: WorkoutResponse) => {
    setActiveWorkout(workout);
    setFeeling("3");
    setNotes("");
    setConsent(false);
    setSheetOpen(true);
  };

  const submitCheckIn = async (skipped: boolean) => {
    if (!activeWorkout) return;
    const hasSensitive = (!skipped && feeling) || notes.trim().length > 0;
    if (hasSensitive && !consent) {
      toast("Marque o consentimento para compartilhar sensação ou notas.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await memberApi.createCheckIn({
        workoutId: activeWorkout.id,
        skipped,
        feeling: skipped || !feeling ? null : parseInt(feeling, 10),
        notes: notes.trim() || null,
      });
      setSheetOpen(false);
      setCheckInSuccess(true);
      toast(skipped ? "Check-in registrado." : "Boa! Treino registrado.");
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro no check-in.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-24 md:pb-6">
      <div className="px-1">
        <p className="text-xs text-muted-foreground">{spaceName ?? "FitRadar"}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Bom dia, {firstName}!</h1>
      </div>

      <PanelState state={state} message={error} onRetry={load}>
        {progress ? (
          <>
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card">
              <CardContent className="flex items-center gap-3.5 pt-4">
                <div className="flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/15">
                  <Zap className="size-5 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-primary">{progress.currentStreak}</p>
                  <p className="text-sm font-semibold">dias seguidos</p>
                  <p className="text-xs text-muted-foreground">
                    {progress.message ?? "Continue assim!"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {mode === "none" ? (
              <Card>
                <CardContent className="pt-4">
                  <h2 className="font-bold">Comece um programa</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {progress.message ?? "Peça ao seu treinador para te matricular."}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {mode === "rest" ? (
              <Card>
                <CardContent className="pt-4">
                  <h2 className="font-bold">Tudo em dia!</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {progress.message ?? "Descanse ou explore outros treinos."}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {mode === "workout" && nextWorkout ? (
              <Card className="overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-primary to-primary/70" />
                <CardContent className="space-y-3 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Hoje
                    </span>
                    {doneToday.has(nextWorkout.id) ? (
                      <span className="ml-auto rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                        Concluído
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">{nextWorkout.title}</h2>
                    <p className="text-sm text-muted-foreground">{nextWorkout.description}</p>
                  </div>
                  {!doneToday.has(nextWorkout.id) ? (
                    <Button className="w-full" size="lg" onClick={() => openCheckIn(nextWorkout)}>
                      Marcar treino feito
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {workouts.length > 0 ? (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Treinos</h2>
                <ul className="space-y-2">
                  {workouts.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
                    >
                      <div>
                        <p className="font-medium">
                          #{w.dayIndex} {w.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{w.description}</p>
                      </div>
                      {doneToday.has(w.id) ? (
                        <span className="text-xs font-semibold text-primary">feito hoje</span>
                      ) : (
                        <Button size="sm" onClick={() => openCheckIn(w)}>
                          Check-in
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <PushOptInBanner show={checkInSuccess} />
          </>
        ) : null}
      </PanelState>

      {sheetOpen && activeWorkout ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Check-in de treino"
        >
          <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 shadow-xl md:rounded-2xl">
            <h2 className="text-lg font-bold">Check-in</h2>
            <p className="text-sm text-muted-foreground">{activeWorkout.title}</p>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="ci-feeling">Como você se sentiu? (1 a 5)</Label>
                <select
                  id="ci-feeling"
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">—</option>
                  <option value="1">1 · difícil</option>
                  <option value="2">2</option>
                  <option value="3">3 · ok</option>
                  <option value="4">4</option>
                  <option value="5">5 · ótimo</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ci-notes">Notas (opcional)</Label>
                <textarea
                  id="ci-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[72px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                Ao informar sensação ou notas, autorizo compartilhar com meu criador.
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button disabled={submitting} onClick={() => void submitCheckIn(false)}>
                Concluí
              </Button>
              <Button variant="ghost" disabled={submitting} onClick={() => void submitCheckIn(true)}>
                Pulei
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
