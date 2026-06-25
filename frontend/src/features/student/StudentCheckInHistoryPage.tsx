import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { memberApi } from "@/lib/api/member-api";
import type { CheckInResponse, WorkoutResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import {
  checkInStatusLabel,
  feelingLabel,
  formatCheckInDate,
} from "@/lib/student/check-in-copy";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

export function StudentCheckInHistoryPage() {
  const [checkIns, setCheckIns] = useState<CheckInResponse[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();

  const workoutById = useMemo(
    () => new Map(workouts.map((w) => [w.id, w])),
    [workouts],
  );

  const loadInitial = useCallback(async () => {
    setState("loading");
    setPage(0);
    try {
      const [workoutList, pageResult] = await Promise.all([
        memberApi.myWorkouts(),
        memberApi.myCheckIns(0, PAGE_SIZE),
      ]);
      setWorkouts(workoutList);
      setCheckIns(pageResult.content);
      setTotalPages(pageResult.totalPages);
      setPage(0);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar histórico.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = async () => {
    const nextPage = page + 1;
    if (nextPage >= totalPages) return;
    setLoadingMore(true);
    try {
      const pageResult = await memberApi.myCheckIns(nextPage, PAGE_SIZE);
      setCheckIns((prev) => [...prev, ...pageResult.content]);
      setPage(nextPage);
      setTotalPages(pageResult.totalPages);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar mais.");
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = page + 1 < totalPages;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 motion-safe:animate-in motion-safe:fade-in md:pb-8">
      <header className="px-1 pt-1">
        <Button variant="outline" size="sm" asChild className="mb-3 h-9 w-fit gap-2 rounded-[9px]">
          <Link to="/student/progress">
            <ChevronLeft className="size-4" aria-hidden />
            Progresso
          </Link>
        </Button>
        <h1 className="text-[23px] font-extrabold tracking-tight">Histórico de check-ins</h1>
        <p className="text-sm text-muted-foreground">
          Seus registros com data, sensação e notas.
        </p>
      </header>

      <PanelState
        state={state === "content" && checkIns.length === 0 ? "empty" : state}
        message={error}
        onRetry={loadInitial}
        emptyVariant="student"
      >
        <ul className="flex list-none flex-col gap-3 p-0">
          {checkIns.map((entry) => {
            const workout = workoutById.get(entry.workoutId);
            const feeling = feelingLabel(entry.feeling);
            return (
              <li key={entry.id}>
                <article className="rounded-2xl border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold capitalize text-foreground">
                        {formatCheckInDate(entry.date)}
                      </p>
                      <p className="mt-0.5 truncate text-[15px] font-extrabold">
                        {workout?.title ?? "Treino"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                        entry.status === "DONE"
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground",
                      )}
                    >
                      {checkInStatusLabel(entry.status)}
                    </span>
                  </div>

                  {feeling ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Sensação:{" "}
                      <span className="font-semibold text-foreground">
                        {entry.feeling}/5 · {feeling}
                      </span>
                    </p>
                  ) : null}

                  {entry.notes?.trim() ? (
                    <p className="mt-2 rounded-[11px] border border-border bg-muted/30 px-3 py-2.5 text-sm leading-relaxed text-foreground/90">
                      {entry.notes}
                    </p>
                  ) : null}

                  {workout ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto p-0 text-primary"
                      asChild
                    >
                      <Link to={`/student/workouts/${workout.id}`}>Ver treino</Link>
                    </Button>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>

        {hasMore ? (
          <Button
            variant="outline"
            className="mt-2 w-full rounded-[12px]"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? "Carregando…" : "Carregar mais"}
          </Button>
        ) : null}
      </PanelState>

      <p className="text-center text-[11px] text-muted-foreground">
        Sugestão, não orientação médica/profissional.
      </p>
    </div>
  );
}
