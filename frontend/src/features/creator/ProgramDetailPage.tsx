import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Clock, GripVertical, Plus, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EnrollStudentsModal } from "@/components/creator/EnrollStudentsModal";
import { CreatorSpaceRequiredPrompt } from "@/components/creator/CreatorSpaceRequiredPrompt";
import { StructuredNutritionPanel } from "@/features/creator/StructuredNutritionPanel";
import { WorkoutThumbnail } from "@/components/fitness/WorkoutThumbnail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCreatorHasSpace } from "@/hooks/useCreatorHasSpace";
import { programsApi } from "@/lib/api/programs-api";
import { studentsApi } from "@/lib/api/students-api";
import type { ProgramResponse, StudentResponse, WorkoutResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { exercisePreview } from "@/lib/creator/workout-exercises";
import { countExercises } from "@/lib/student/workout-content";
import { cn } from "@/lib/utils";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import {
  capitalizeLabel,
  formatCountLabel,
  formatItemContentCount,
} from "@/lib/space/vocabulary";

export function ProgramDetailPage() {
  const { toast } = useToast();
  const { vocabulary: v, category } = useSpaceVocabulary();
  const { hasSpace } = useCreatorHasSpace();
  const canWrite = hasSpace === true;
  const ProgramIcon = v.programIcon;
  const ItemIcon = v.itemIcon;
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<ProgramResponse | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [enrollWarning, setEnrollWarning] = useState<string>();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentResponse[]>([]);
  const [selectedEnrollIds, setSelectedEnrollIds] = useState<string[]>([]);
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [nutritionTab, setNutritionTab] = useState<"markdown" | "structured">("markdown");

  usePageTitle(program?.title ?? null);

  const load = useCallback(async () => {
    setState("loading");
    setEnrollWarning(undefined);
    try {
      const [p, w, studentsPage] = await Promise.all([
        programsApi.get(id),
        programsApi.workouts(id),
        studentsApi.list(0, 200),
      ]);
      setProgram(p);
      setNutritionTab(p.nutritionStructured ? "structured" : "markdown");
      setWorkouts(w.sort((a, b) => a.dayIndex - b.dayIndex));
      setAllStudents(studentsPage.content);

      const enrollmentResults = await Promise.allSettled(
        studentsPage.content.map((s) => studentsApi.enrollments(s.id)),
      );
      let count = 0;
      const enrolledStudentIds: string[] = [];
      let enrollFailures = 0;
      enrollmentResults.forEach((result, idx) => {
        if (result.status === "rejected") {
          enrollFailures += 1;
          return;
        }
        const active = result.value.find((e) => e.programId === id && e.active);
        if (active) {
          count += 1;
          enrolledStudentIds.push(studentsPage.content[idx].id);
        }
      });
      if (enrollFailures > 0) {
        setEnrollWarning(
          `Matrículas parcialmente indisponíveis para ${enrollFailures} aluno(s).`,
        );
      }
      setEnrolledCount(count);
      setSelectedEnrollIds(enrolledStudentIds);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar programa.");
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistOrder = async (ordered: WorkoutResponse[]) => {
    try {
      await Promise.all(
        ordered.map((w, index) =>
          programsApi.updateWorkout(id, w.id, {
            title: w.title,
            description: w.description,
            contentMarkdown: w.contentMarkdown,
            dayIndex: index + 1,
          }),
        ),
      );
      setWorkouts(ordered.map((w, i) => ({ ...w, dayIndex: i + 1 })));
    } catch (e) {
      toast(e instanceof ApiError ? e.message : v.reorderItemsError, "error");
      await load();
    }
  };

  const onDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const next = [...workouts];
    const from = next.findIndex((w) => w.id === draggingId);
    const to = next.findIndex((w) => w.id === targetId);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggingId(null);
    setDragOverId(null);
    void persistOrder(next);
  };

  const deleteWorkout = async (workout: WorkoutResponse) => {
    const ok = await confirm({
      title: v.deleteItemConfirmTitle,
      description: `“${workout.title}” será removido permanentemente do ${v.program.singular}. Esta ação não pode ser desfeita.`,
      confirmLabel: v.deleteItemConfirmLabel,
      destructive: true,
    });
    if (!ok) return;
    try {
      await programsApi.removeWorkout(id, workout.id);
      toast(v.itemDeleted);
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : `Erro ao excluir ${v.item.singular}.`, "error");
    }
  };

  const saveEnrollments = async () => {
    setEnrollSaving(true);
    try {
      for (const student of allStudents) {
        const list = await studentsApi.enrollments(student.id);
        const active = list.find((e) => e.programId === id && e.active);
        const should = selectedEnrollIds.includes(student.id);
        if (should && !active) {
          await studentsApi.enroll(student.id, { programId: id });
        }
        if (!should && active) {
          await studentsApi.unenroll(student.id, active.id);
        }
      }
      setShowEnroll(false);
      await load();
      toast("Matrículas atualizadas.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao salvar matrículas.", "error");
    } finally {
      setEnrollSaving(false);
    }
  };

  const enrollOptions = allStudents.map((s) => ({
    id: s.id,
    name: s.name,
    selected: selectedEnrollIds.includes(s.id),
  }));

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 animate-in fade-in duration-300">
      {confirmDialog}

      <Button variant="outline" size="sm" asChild className="h-9 w-fit gap-2 rounded-[9px]">
        <Link to="/app/programs">
          <ChevronLeft className="size-4" aria-hidden />
          {capitalizeLabel(v.program.plural)}
        </Link>
      </Button>

      <PanelState state={state} message={error} onRetry={load}>
        {program ? (
          <>
            {enrollWarning ? (
              <Alert>
                <AlertDescription>{enrollWarning}</AlertDescription>
              </Alert>
            ) : null}

            {!canWrite && hasSpace === false ? <CreatorSpaceRequiredPrompt compact /> : null}

            <div className="flex flex-wrap items-start justify-between gap-5 rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_24px_rgba(0,0,0,0.28)] md:p-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] border border-primary/30 bg-primary/10">
                  <ProgramIcon className="size-6 text-primary" strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <h1 className="text-[21px] font-extrabold tracking-tight">{program.title}</h1>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {program.description ?? "Sem descrição."}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-3.5 text-[12.5px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden />
                      Contínuo
                    </span>
                    <span aria-hidden>·</span>
                    <span>{formatCountLabel(workouts.length, v.item.singular, v.item.plural)}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      {enrolledCount} alunos matriculados
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {canWrite ? (
                  <>
                    <Button variant="outline" className="h-10 rounded-[10px]" asChild>
                      <Link to={`/app/programs/${id}/edit`}>Editar {v.program.singular}</Link>
                    </Button>
                    <Button variant="outline" className="h-10 rounded-[10px]" onClick={() => setShowEnroll(true)}>
                      Matricular aluno
                    </Button>
                    <Button
                      className="h-10 gap-1.5 rounded-[10px] shadow-[0_4px_14px_hsl(var(--primary)/0.26)]"
                      onClick={() => navigate(`/app/programs/${id}/workouts/new`)}
                    >
                      <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                      {v.addItem}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            {category === "NUTRITION" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={nutritionTab === "markdown" ? "default" : "outline"}
                  onClick={() => setNutritionTab("markdown")}
                >
                  Refeições em texto
                </Button>
                <Button
                  size="sm"
                  variant={nutritionTab === "structured" ? "default" : "outline"}
                  onClick={() => setNutritionTab("structured")}
                >
                  Plano com macros (TACO)
                </Button>
              </div>
            ) : null}

            {category === "NUTRITION" && nutritionTab === "structured" ? (
              <StructuredNutritionPanel programId={id} canWrite={canWrite} />
            ) : workouts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-[14px] border border-dashed border-border bg-secondary/20 px-6 py-14 text-center">
                <div className="flex size-[52px] items-center justify-center rounded-[14px] border border-dashed border-border">
                  <ItemIcon className="size-6 text-muted-foreground" strokeWidth={1.8} aria-hidden />
                </div>
                <div>
                  <p className="text-lg font-bold">{v.noItemYet}</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                    {v.programDetailEmptyHint}
                  </p>
                </div>
                <Button
                  disabled={!canWrite}
                  onClick={() => navigate(`/app/programs/${id}/workouts/new`)}
                >
                  {v.addFirstItem}
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="text-[13px] font-bold">{v.itemList}</span>
                  <span className="text-[12.5px] text-muted-foreground">arraste para reordenar</span>
                  <GripVertical className="size-3.5 text-muted-foreground/70" aria-hidden />
                </div>
                <div
                  className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_6px_24px_rgba(0,0,0,0.28)]"
                  role="list"
                  aria-label={`Lista de ${v.item.plural} do ${v.program.singular}`}
                >
                  {workouts.map((w, index) => (
                    <div
                      key={w.id}
                      role="listitem"
                      draggable={canWrite}
                      onDragStart={() => setDraggingId(w.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggingId && draggingId !== w.id) setDragOverId(w.id);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        onDrop(w.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                      className={cn(
                        "flex cursor-grab items-center gap-3.5 border-b border-border/80 px-5 py-3.5 last:border-b-0 active:cursor-grabbing",
                        draggingId === w.id && "opacity-40",
                        dragOverId === w.id && "border-t-2 border-t-primary pt-[13px]",
                      )}
                    >
                      <div
                        className="flex size-[30px] items-center justify-center text-muted-foreground/70"
                        aria-hidden
                      >
                        <GripVertical className="size-3.5" />
                      </div>
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-primary/30 bg-primary/10 text-[13px] font-extrabold text-primary"
                        aria-label={`Dia ${index + 1}`}
                      >
                        {index + 1}
                      </div>
                      <WorkoutThumbnail
                        title={w.title}
                        description={w.description}
                        contentMarkdown={w.contentMarkdown}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold">{w.title}</p>
                        <p className="truncate text-[12.5px] text-muted-foreground">
                          {w.description || exercisePreview(w.contentMarkdown, category)}
                        </p>
                      </div>
                      <span className="hidden shrink-0 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground sm:inline">
                        {formatItemContentCount(countExercises(w.contentMarkdown), v)}
                      </span>
                      <div className="flex shrink-0 gap-1.5">
                        {canWrite ? (
                          <>
                            <Button variant="outline" size="sm" className="h-[34px] rounded-[9px]" asChild>
                              <Link to={`/app/programs/${id}/workouts/${w.id}/edit`}>Editar</Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-[34px] rounded-[9px] text-destructive hover:bg-destructive/10"
                              onClick={() => void deleteWorkout(w)}
                            >
                              Excluir
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </PanelState>

      <EnrollStudentsModal
        open={showEnroll}
        programTitle={program?.title ?? ""}
        students={enrollOptions}
        saving={enrollSaving}
        onClose={() => setShowEnroll(false)}
        onToggle={(studentId) =>
          setSelectedEnrollIds((prev) =>
            prev.includes(studentId) ? prev.filter((x) => x !== studentId) : [...prev, studentId],
          )
        }
        onSave={() => void saveEnrollments()}
      />
    </div>
  );
}
