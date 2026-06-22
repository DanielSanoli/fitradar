import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { programsApi } from "@/lib/api/programs-api";
import type { ProgramRequest, ProgramResponse, WorkoutResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";

function priceLabel(p: ProgramResponse): string {
  return p.paid && p.price != null ? `R$ ${p.price}` : "gratuito";
}

export function ProgramsListPage() {
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await programsApi.list();
      setPrograms(data);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar programas.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "Excluir programa?",
      description: "Este programa e todos os treinos serão removidos permanentemente.",
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!ok) return;
    try {
      await programsApi.remove(id);
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao excluir.", "error");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {confirmDialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Programas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie programas de treino e matricule alunos.
          </p>
        </div>
        <Button onClick={() => navigate("/app/programs/new")}>+ Novo programa</Button>
      </div>

      <PanelState
        state={
          state === "content" && programs.length === 0 ? "empty" : state === "content" ? "content" : state
        }
        message={error}
        onRetry={load}
        icon="📋"
        title="Nenhum programa"
        actionLabel="+ Novo programa"
        onAction={() => navigate("/app/programs/new")}
        rows={3}
      >
        <ul className="flex flex-col gap-3">
          {programs.map((p) => (
            <li key={p.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <div>
                    <Link
                      to={`/app/programs/${p.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {p.title}
                      {!p.active ? (
                        <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>
                      ) : null}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {p.description ?? ""} · {p.workoutCount} treino(s) · {priceLabel(p)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/app/programs/${p.id}`}>Treinos</Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => void remove(p.id)}>
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </PanelState>
    </div>
  );
}

export function ProgramFormPage({ mode }: { mode: "create" | "edit" }) {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "content">(
    mode === "edit" ? "loading" : "content",
  );
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    void programsApi
      .get(id)
      .then((p) => {
        setTitle(p.title);
        setDescription(p.description ?? "");
        setPrice(p.price ?? "");
        setActive(p.active);
        setLoadState("content");
      })
      .catch((e) => {
        setLoadError(e instanceof ApiError ? e.message : "Erro ao carregar programa.");
        setLoadState("error");
      });
  }, [mode, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body: ProgramRequest = {
      title,
      description: description || null,
      active,
      price: price ? price : null,
    };
    try {
      if (mode === "create") {
        const created = await programsApi.create(body);
        navigate(`/app/programs/${created.id}`);
      } else if (id) {
        await programsApi.update(id, body);
        navigate(`/app/programs/${id}`);
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loadState !== "content") {
    return (
      <PanelState
        state={loadState}
        message={loadError}
        onRetry={() => {
          if (mode === "edit" && id) {
            setLoadState("loading");
            void programsApi
              .get(id)
              .then((p) => {
                setTitle(p.title);
                setDescription(p.description ?? "");
                setPrice(p.price ?? "");
                setActive(p.active);
                setLoadState("content");
              })
              .catch((e) => {
                setLoadError(e instanceof ApiError ? e.message : "Erro ao carregar programa.");
                setLoadState("error");
              });
          }
        }}
        rows={3}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={mode === "edit" && id ? `/app/programs/${id}` : "/app/programs"}>
          ← Voltar
        </Link>
      </Button>
      <h1 className="mb-4 text-xl font-bold">
        {mode === "create" ? "Novo programa" : "Editar programa"}
      </h1>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="prog-title">Título</Label>
          <Input id="prog-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prog-desc">Descrição</Label>
          <textarea
            id="prog-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prog-price">Preço (R$ — vazio = gratuito)</Label>
          <Input
            id="prog-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <label htmlFor="prog-active" className="flex items-center gap-2 text-sm">
          <input
            id="prog-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Programa ativo
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </form>
    </div>
  );
}

export function ProgramDetailPage() {
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { id = "" } = useParams();
  const [program, setProgram] = useState<ProgramResponse | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [wkTitle, setWkTitle] = useState("");
  const [wkDay, setWkDay] = useState("0");
  const [wkDesc, setWkDesc] = useState("");
  const [wkContent, setWkContent] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [p, w] = await Promise.all([programsApi.get(id), programsApi.workouts(id)]);
      setProgram(p);
      setWorkouts(w);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar programa.");
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const addWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await programsApi.createWorkout(id, {
        title: wkTitle,
        dayIndex: parseInt(wkDay || "0", 10),
        description: wkDesc || null,
        contentMarkdown: wkContent || null,
      });
      setShowAddWorkout(false);
      setWkTitle("");
      setWkDay("0");
      setWkDesc("");
      setWkContent("");
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Erro ao adicionar treino.", "error");
    }
  };

  const removeWorkout = async (workoutId: string, title: string) => {
    const ok = await confirm({
      title: "Excluir treino?",
      description: `"${title}" será removido deste programa.`,
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!ok) return;
    try {
      await programsApi.removeWorkout(id, workoutId);
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao excluir treino.", "error");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {confirmDialog}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/app/programs">← Programas</Link>
      </Button>

      <PanelState state={state} message={error} onRetry={load}>
        {program ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold">{program.title}</h1>
                <p className="text-sm text-muted-foreground">{program.description}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/app/programs/${id}/edit`}>Editar</Link>
              </Button>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Treinos</h2>
                <Button size="sm" onClick={() => setShowAddWorkout(true)}>
                  + Treino
                </Button>
              </div>

              {showAddWorkout ? (
                <Card className="mb-4">
                  <CardContent className="pt-4">
                    <form onSubmit={(e) => void addWorkout(e)} className="flex flex-col gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="wk-title">Título</Label>
                        <Input
                          id="wk-title"
                          required
                          value={wkTitle}
                          onChange={(e) => setWkTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="wk-day">Ordem (dia)</Label>
                        <Input
                          id="wk-day"
                          type="number"
                          min="0"
                          value={wkDay}
                          onChange={(e) => setWkDay(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="wk-desc">Descrição</Label>
                        <Input
                          id="wk-desc"
                          value={wkDesc}
                          onChange={(e) => setWkDesc(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="wk-content">Conteúdo (markdown)</Label>
                        <textarea
                          id="wk-content"
                          value={wkContent}
                          onChange={(e) => setWkContent(e.target.value)}
                          className="min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Adicionar</Button>
                        <Button type="button" variant="ghost" onClick={() => setShowAddWorkout(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : null}

              {workouts.length === 0 ? (
                <PanelState
                  state="empty"
                  title="Nenhum treino"
                  message="Adicione o primeiro treino deste programa."
                  className="py-6"
                />
              ) : (
                <ul className="space-y-2">
                  {workouts.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">
                          #{w.dayIndex} {w.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{w.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        aria-label={`Excluir treino ${w.title}`}
                        onClick={() => void removeWorkout(w.id, w.title)}
                      >
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </PanelState>
    </div>
  );
}
