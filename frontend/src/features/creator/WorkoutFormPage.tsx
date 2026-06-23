import { useEffect, useState } from "react";
import { ChevronLeft, Plus, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelState } from "@/components/ui/PanelState";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { programsApi } from "@/lib/api/programs-api";
import { ApiError } from "@/lib/api/types";
import {
  exercisesToMarkdown,
  markdownToExercises,
  newExerciseRow,
  type WorkoutExerciseRow,
} from "@/lib/creator/workout-exercises";

export function WorkoutFormPage({ mode }: { mode: "create" | "edit" }) {
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { id: programId = "", workoutId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<WorkoutExerciseRow[]>([]);
  const [dayIndex, setDayIndex] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "content">(
    mode === "edit" ? "loading" : "content",
  );
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    if (mode === "create") {
      void programsApi.workouts(programId).then((list) => {
        setDayIndex(list.length + 1);
      });
      return;
    }
    if (!workoutId) return;
    void Promise.all([programsApi.workouts(programId)])
      .then(([list]) => {
        const w = list.find((x) => x.id === workoutId);
        if (!w) throw new Error("Treino não encontrado");
        setTitle(w.title);
        setDescription(w.description ?? "");
        setDayIndex(w.dayIndex);
        setExercises(markdownToExercises(w.contentMarkdown));
        setLoadState("content");
      })
      .catch((e) => {
        setLoadError(e instanceof ApiError ? e.message : "Erro ao carregar treino.");
        setLoadState("error");
      });
  }, [mode, programId, workoutId]);

  const updateExercise = (index: number, patch: Partial<WorkoutExerciseRow>) => {
    setExercises((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeExercise = async (index: number) => {
    const row = exercises[index];
    if (row.name.trim()) {
      const ok = await confirm({
        title: "Remover exercício?",
        description: `“${row.name.trim()}” será removido deste treino.`,
        confirmLabel: "Remover",
        destructive: true,
      });
      if (!ok) return;
    }
    setExercises((rows) => rows.filter((_, i) => i !== index));
  };

  const deleteWorkout = async () => {
    if (!workoutId) return;
    const ok = await confirm({
      title: "Excluir treino?",
      description: "Este treino será removido permanentemente do programa.",
      confirmLabel: "Excluir treino",
      destructive: true,
    });
    if (!ok) return;
    try {
      await programsApi.removeWorkout(programId, workoutId);
      toast("Treino excluído.");
      navigate(`/app/programs/${programId}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Erro ao excluir treino.", "error");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      title: title.trim() || "Novo treino",
      description: description.trim() || null,
      contentMarkdown: exercisesToMarkdown(exercises) || null,
      dayIndex,
    };
    try {
      if (mode === "create") {
        await programsApi.createWorkout(programId, body);
      } else if (workoutId) {
        await programsApi.updateWorkout(programId, workoutId, body);
      }
      navigate(`/app/programs/${programId}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Erro ao salvar treino.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loadState !== "content") {
    return (
      <PanelState
        state={loadState}
        message={loadError}
        onRetry={() => setLoadState("loading")}
        rows={3}
      />
    );
  }

  const heading = mode === "create" ? "Novo treino" : "Editar treino";
  const saveLabel = mode === "create" ? "Adicionar treino" : "Salvar alterações";
  const exCount =
    exercises.length === 1 ? "1 exercício" : `${exercises.length} exercícios`;

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-5 animate-in fade-in duration-300">
      {confirmDialog}
      <Button variant="outline" size="sm" asChild className="h-9 w-fit gap-2 rounded-[9px]">
        <Link to={`/app/programs/${programId}`}>
          <ChevronLeft className="size-4" />
          Voltar para o programa
        </Link>
      </Button>

      <form
        onSubmit={(e) => void submit(e)}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-[0_6px_24px_rgba(0,0,0,0.28)] md:p-8"
      >
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">{heading}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Dê um título, escreva uma descrição e adicione os exercícios.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="min-w-[240px] flex-1 space-y-1.5">
            <Label htmlFor="wk-title">Título do treino</Label>
            <Input
              id="wk-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Lower Body A"
              className="h-[46px] rounded-[11px] bg-secondary/40"
            />
          </div>
          <div className="min-w-[260px] flex-[1.5] space-y-1.5">
            <Label htmlFor="wk-desc">Descrição curta</Label>
            <Input
              id="wk-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Foco do treino, músculo alvo..."
              className="h-[46px] rounded-[11px] bg-secondary/40"
            />
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[15px] font-bold">Exercícios</span>
              <span className="ml-2.5 text-[13px] text-muted-foreground">{exCount}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 rounded-[9px] border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => setExercises((rows) => [...rows, newExerciseRow()])}
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              Adicionar exercício
            </Button>
          </div>

          {exercises.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-border bg-secondary/20 px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhum exercício adicionado. Clique em &quot;Adicionar exercício&quot; para começar.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[12px] border border-border bg-secondary/20">
              <div className="hidden grid-cols-[1fr_70px_94px_74px_36px] gap-2 border-b border-border px-4 py-2 sm:grid">
                {["Exercício", "Séries", "Repetições", "Descanso", ""].map((h) => (
                  <span
                    key={h}
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {exercises.map((ex, index) => (
                <div
                  key={ex.id}
                  className="grid grid-cols-1 gap-2 border-b border-border/80 px-4 py-2.5 last:border-b-0 sm:grid-cols-[1fr_70px_94px_74px_36px] sm:items-center"
                >
                  <Input
                    value={ex.name}
                    onChange={(e) => updateExercise(index, { name: e.target.value })}
                    placeholder="Nome do exercício"
                    className="h-[38px] rounded-[9px] bg-card text-[13.5px]"
                  />
                  <Input
                    value={ex.sets}
                    onChange={(e) => updateExercise(index, { sets: e.target.value })}
                    placeholder="3"
                    className="h-[38px] rounded-[9px] bg-card text-center text-[13.5px]"
                  />
                  <Input
                    value={ex.reps}
                    onChange={(e) => updateExercise(index, { reps: e.target.value })}
                    placeholder="10–12"
                    className="h-[38px] rounded-[9px] bg-card text-center text-[13.5px]"
                  />
                  <Input
                    value={ex.rest}
                    onChange={(e) => updateExercise(index, { rest: e.target.value })}
                    placeholder="60s"
                    className="h-[38px] rounded-[9px] bg-card text-center text-[13.5px]"
                  />
                  <button
                    type="button"
                    onClick={() => void removeExercise(index)}
                    className="flex size-[34px] items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remover exercício ${ex.name.trim() || index + 1}`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="h-[46px] rounded-[11px] px-5" asChild>
              <Link to={`/app/programs/${programId}`}>Cancelar</Link>
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-[46px] rounded-[11px] px-7 shadow-[0_4px_18px_hsl(var(--primary)/0.28)]"
            >
              {saving ? "Salvando…" : saveLabel}
            </Button>
          </div>
          {mode === "edit" ? (
            <Button
              type="button"
              variant="outline"
              className="h-[46px] rounded-[11px] border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => void deleteWorkout()}
            >
              Excluir treino
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
