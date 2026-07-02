import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { RestTimer } from "@/components/student/RestTimer";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useScreenWakeLock } from "@/hooks/useScreenWakeLock";
import {
  parseWorkoutMarkdownToSteps,
  type WorkoutPlayerItem,
} from "@/lib/student/workout-player-parser";
import {
  clearWorkoutSession,
  loadWorkoutSession,
  saveWorkoutSession,
  type WorkoutPlayerSession,
} from "@/lib/student/workout-player-session";
import { cn } from "@/lib/utils";

export type WorkoutPlayerProps = {
  workoutId: string;
  workoutTitle: string;
  contentMarkdown: string;
  onFinish: () => void;
  onClose: () => void;
};

function progressPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function WorkoutPlayer({
  workoutId,
  workoutTitle,
  contentMarkdown,
  onFinish,
  onClose,
}: WorkoutPlayerProps) {
  const { confirm, dialog } = useConfirmDialog();
  useScreenWakeLock(true);

  const parsed = useMemo(
    () => parseWorkoutMarkdownToSteps(contentMarkdown),
    [contentMarkdown],
  );
  const items = parsed.items;

  const [session, setSession] = useState<WorkoutPlayerSession>(() => {
    const existing = loadWorkoutSession(workoutId);
    if (existing) return existing;
    return {
      workoutId,
      workoutTitle,
      contentMarkdown,
      startedAt: new Date().toISOString(),
      currentItemIndex: 0,
      completedItemIds: [],
    };
  });

  useEffect(() => {
    saveWorkoutSession(session);
  }, [session]);

  const completedSet = useMemo(
    () => new Set(session.completedItemIds),
    [session.completedItemIds],
  );

  const total = items.length;
  const completedCount = session.completedItemIds.length;
  const allDone = total > 0 && completedCount >= total;
  const currentIndex = Math.min(session.currentItemIndex, Math.max(0, total - 1));
  const current: WorkoutPlayerItem | null = total > 0 ? items[currentIndex] : null;

  const updateSession = useCallback((patch: Partial<WorkoutPlayerSession>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  const markCurrentDone = () => {
    if (!current) return;
    const nextCompleted = completedSet.has(current.id)
      ? session.completedItemIds
      : [...session.completedItemIds, current.id];
    const nextIndex = Math.min(currentIndex + 1, total - 1);
    updateSession({
      completedItemIds: nextCompleted,
      currentItemIndex: nextIndex,
    });
  };

  const goPrev = () => {
    updateSession({ currentItemIndex: Math.max(0, currentIndex - 1) });
  };

  const goNext = () => {
    updateSession({ currentItemIndex: Math.min(total - 1, currentIndex + 1) });
  };

  const handleAbandon = async () => {
    const ok = await confirm({
      title: "Abandonar treino?",
      description: "O progresso desta sessão será perdido. Você pode iniciar de novo quando quiser.",
      confirmLabel: "Abandonar",
      cancelLabel: "Continuar treino",
      destructive: true,
    });
    if (!ok) return;
    clearWorkoutSession(workoutId);
    onClose();
  };

  const handleFinish = () => {
    clearWorkoutSession(workoutId);
    onFinish();
  };

  const pct = progressPercent(completedCount, total);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      role="dialog"
      aria-modal
      aria-label={`Modo treino: ${workoutTitle}`}
    >
      {dialog}

      <header className="shrink-0 border-b border-border/80 bg-card/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-muted-foreground">{workoutTitle}</p>
          <button
            type="button"
            onClick={() => void handleAbandon()}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60"
            aria-label="Abandonar treino"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso do treino: ${pct}%`}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {completedCount} de {total} concluídos
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        {current ? (
          <section className="flex flex-1 flex-col justify-center">
            {current.blockTitle ? (
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-primary">
                {current.blockTitle}
              </p>
            ) : null}
            <h2 className="text-center text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
              {current.label}
            </h2>
            {current.detail ? (
              <p className="mt-3 text-center text-lg text-muted-foreground">{current.detail}</p>
            ) : null}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Exercício {currentIndex + 1} de {total}
            </p>
          </section>
        ) : (
          <p className="text-center text-muted-foreground">Nenhum exercício neste treino.</p>
        )}

        <RestTimer />
      </main>

      <footer className="shrink-0 space-y-3 border-t border-border/80 bg-card/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm">
        {allDone ? (
          <Button
            type="button"
            size="lg"
            className="h-14 w-full rounded-2xl text-lg font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)]"
            onClick={handleFinish}
          >
            <Check className="size-6" strokeWidth={3} aria-hidden />
            Finalizar treino
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="lg"
              className="h-14 w-full rounded-2xl text-lg font-bold"
              onClick={markCurrentDone}
              disabled={!current}
            >
              {current && completedSet.has(current.id) ? (
                <>
                  <Check className="size-6" strokeWidth={3} aria-hidden />
                  Concluído — próximo
                </>
              ) : (
                "Marcar como feito"
              )}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 rounded-xl font-semibold"
                onClick={goPrev}
                disabled={currentIndex <= 0}
              >
                <ChevronLeft className="size-5" aria-hidden />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className={cn("h-12 rounded-xl font-semibold")}
                onClick={goNext}
                disabled={currentIndex >= total - 1}
              >
                Próximo
                <ChevronRight className="size-5" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground">
          Sugestão, não orientação médica/profissional.
        </p>
      </footer>
    </div>
  );
}
