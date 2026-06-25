import { useCallback, useEffect, useState } from "react";
import { Clock, Plus, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CreatorEmptyRings } from "@/components/creator/CreatorEmptyRings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PanelState } from "@/components/ui/PanelState";
import { Button } from "@/components/ui/button";
import { programsApi } from "@/lib/api/programs-api";
import { studentsApi } from "@/lib/api/students-api";
import type { ProgramResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { PROGRAM_ACCENT_BARS } from "@/lib/creator/display-utils";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import {
  formatCountLabel,
  formatProgramItemSummary,
} from "@/lib/space/vocabulary";

type ProgramWithMeta = ProgramResponse & { enrolledCount: number };

async function loadProgramsWithEnrollment(): Promise<{
  programs: ProgramWithMeta[];
  enrollWarning?: string;
}> {
  const programs = await programsApi.list();
  const studentsPage = await studentsApi.list(0, 200);
  const enrollmentResults = await Promise.allSettled(
    studentsPage.content.map((s) => studentsApi.enrollments(s.id)),
  );

  const counts = new Map<string, number>();
  let failures = 0;
  enrollmentResults.forEach((result) => {
    if (result.status === "rejected") {
      failures += 1;
      return;
    }
    for (const en of result.value) {
      if (en.active) {
        counts.set(en.programId, (counts.get(en.programId) ?? 0) + 1);
      }
    }
  });

  return {
    programs: programs.map((p) => ({ ...p, enrolledCount: counts.get(p.id) ?? 0 })),
    enrollWarning:
      failures > 0
        ? `Contagem de matrículas parcial — ${failures} aluno(s) não puderam ser consultados.`
        : undefined,
  };
}

export function ProgramsListPage() {
  const navigate = useNavigate();
  const { vocabulary: v } = useSpaceVocabulary();
  const ProgramIcon = v.programIcon;
  const ItemIcon = v.itemIcon;
  const [programs, setPrograms] = useState<ProgramWithMeta[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [enrollWarning, setEnrollWarning] = useState<string>();

  const load = useCallback(async () => {
    setState("loading");
    setEnrollWarning(undefined);
    try {
      const { programs: list, enrollWarning: warning } = await loadProgramsWithEnrollment();
      setPrograms(list);
      if (warning) setEnrollWarning(warning);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar programas.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalWorkouts = programs.reduce((a, p) => a + p.workoutCount, 0);
  const subtitle =
    programs.length === 0
      ? v.programsPageSubtitleEmpty
      : formatProgramItemSummary(programs.length, totalWorkouts, v);

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-5 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">{v.programsAndItems}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          onClick={() => navigate("/app/programs/new")}
          className="h-11 gap-2 rounded-[11px] px-5 shadow-[0_4px_18px_hsl(var(--primary)/0.28)]"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          Criar {v.program.singular}
        </Button>
      </div>

      {enrollWarning ? (
        <Alert>
          <AlertDescription>{enrollWarning}</AlertDescription>
        </Alert>
      ) : null}

      <PanelState
        state={state === "content" && programs.length === 0 ? "empty" : state}
        message={error}
        onRetry={load}
        rows={3}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map((p, i) => (
            <article
              key={p.id}
              className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_6px_24px_rgba(0,0,0,0.28)] transition-shadow hover:shadow-[0_10px_32px_rgba(0,0,0,0.38)]"
            >
              <div
                className="h-1"
                style={{ background: PROGRAM_ACCENT_BARS[i % PROGRAM_ACCENT_BARS.length] }}
                aria-hidden
              />
              <div className="flex flex-1 flex-col gap-2.5 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[11px] border border-primary/25 bg-primary/10">
                      <ProgramIcon className="size-5 text-primary" strokeWidth={2} aria-hidden />
                    </div>
                    <h2 className="text-[17px] font-bold tracking-tight">{p.title}</h2>
                  </div>
                  <Button variant="outline" size="sm" className="h-[30px] shrink-0 rounded-lg px-3 text-xs" asChild>
                    <Link to={`/app/programs/${p.id}/edit`}>Editar</Link>
                  </Button>
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {p.description ?? "Sem descrição."}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border bg-secondary/30 px-5 py-3">
                <div className="flex flex-wrap gap-3.5 text-[12.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" aria-hidden />
                    Contínuo
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ItemIcon className="size-3.5" aria-hidden />
                    {formatCountLabel(p.workoutCount, v.item.singular, v.item.plural)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" aria-hidden />
                    {p.enrolledCount} alunos
                  </span>
                </div>
                <Button size="sm" className="h-[34px] rounded-[9px] px-3.5" asChild>
                  <Link to={`/app/programs/${p.id}`}>Abrir</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </PanelState>

      {state === "content" && programs.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
          <CreatorEmptyRings size="lg" />
          <div>
            <p className="text-[22px] font-extrabold tracking-tight">
              Crie seu primeiro {v.program.singular}
            </p>
            <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              {v.programsListEmptyDescription}
            </p>
          </div>
          <Button
            size="lg"
            className="h-[46px] gap-2 rounded-[11px] px-7 shadow-[0_4px_18px_hsl(var(--primary)/0.3)]"
            onClick={() => navigate("/app/programs/new")}
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            Criar primeiro {v.program.singular}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { ProgramDetailPage } from "@/features/creator/ProgramDetailPage";
export { ProgramFormPage } from "@/features/creator/ProgramFormPage";
export { WorkoutFormPage } from "@/features/creator/WorkoutFormPage";
