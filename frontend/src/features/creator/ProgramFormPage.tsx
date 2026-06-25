import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PanelState } from "@/components/ui/PanelState";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import { programsApi } from "@/lib/api/programs-api";
import type { ProgramRequest } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";

export function ProgramFormPage({ mode }: { mode: "create" | "edit" }) {
  const { toast } = useToast();
  const { vocabulary: v } = useSpaceVocabulary();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
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

  usePageTitle(mode === "create" ? v.newProgram : title || v.editProgram);

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
      title: title.trim() || "Novo programa",
      description: description.trim() || null,
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

  const heading = mode === "create" ? "Novo programa" : "Editar programa";
  const saveLabel = mode === "create" ? "Criar programa" : "Salvar alterações";
  const backTo = mode === "edit" && id ? `/app/programs/${id}` : "/app/programs";

  const deleteProgram = async () => {
    if (!id) return;
    const ok = await confirm({
      title: "Excluir programa?",
      description:
        "Todos os treinos deste programa serão removidos. Alunos matriculados perderão o acesso. Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir programa",
      destructive: true,
    });
    if (!ok) return;
    try {
      await programsApi.remove(id);
      toast("Programa excluído.");
      navigate("/app/programs");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Erro ao excluir.", "error");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 animate-in fade-in duration-300">
      {confirmDialog}
      <Button variant="outline" size="sm" asChild className="h-9 w-fit gap-2 rounded-[9px]">
        <Link to={backTo}>
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
      </Button>

      <form
        onSubmit={(e) => void submit(e)}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-[0_6px_24px_rgba(0,0,0,0.28)] md:p-8"
      >
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">{heading}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Preencha os detalhes do programa.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prog-title">Nome do programa</Label>
          <Input
            id="prog-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Base de Força"
            className="h-[46px] rounded-[11px] bg-secondary/40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prog-desc">Descrição</Label>
          <textarea
            id="prog-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Para quem é e o que promete."
            className="min-h-[80px] w-full resize-y rounded-[11px] border border-border bg-secondary/40 px-3.5 py-3 text-sm leading-relaxed focus:border-primary/55 focus:outline-none focus:ring-[3px] focus:ring-primary/15"
          />
        </div>

        <details className="rounded-[11px] border border-border bg-secondary/20 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-muted-foreground">
            Preço e visibilidade (opcional)
          </summary>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="prog-price">Preço (R$ — vazio = gratuito)</Label>
              <Input
                id="prog-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-[46px] rounded-[11px]"
              />
            </div>
            {price && parseFloat(price) > 0 ? (
              <Alert className="mt-1">
                <AlertDescription className="text-[13px]">
                  Programas pagos exigem conta Asaas conectada em{" "}
                  <Link to="/app/marketplace" className="font-semibold text-primary underline">
                    Vendas & recebimento
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            ) : null}
            <label htmlFor="prog-active" className="flex items-center gap-2 text-sm">
              <input
                id="prog-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Programa ativo
            </label>
          </div>
        </details>

        <div className="h-px bg-border" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" className="h-[46px] rounded-[11px] px-5" asChild>
              <Link to={backTo}>Cancelar</Link>
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
              onClick={() => void deleteProgram()}
            >
              Excluir programa
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
