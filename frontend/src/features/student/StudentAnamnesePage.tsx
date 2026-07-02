import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { anamneseApi } from "@/lib/api/anamnese-api";
import type {
  AnamneseRequest,
  AnamneseResponse,
  ExperienciaTreino,
  NivelAtividadeRotina,
  ObjetivoPrincipal,
} from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import {
  experienciaTreinoOptions,
  nivelAtividadeOptions,
  objetivoPrincipalOptions,
} from "@/lib/student/anamnese-labels";

const selectClass =
  "flex h-11 w-full rounded-[11px] border border-border bg-secondary/40 px-3.5 text-sm transition-colors focus:border-primary/60 focus:outline-none focus:ring-[3px] focus:ring-primary/15";

export function StudentAnamnesePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [existing, setExisting] = useState<AnamneseResponse | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready">("loading");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [objetivoPrincipal, setObjetivoPrincipal] = useState<ObjetivoPrincipal>("SAUDE");
  const [experienciaTreino, setExperienciaTreino] = useState<ExperienciaTreino>("INICIANTE");
  const [diasDisponiveisSemana, setDiasDisponiveisSemana] = useState("3");
  const [nivelAtividadeRotina, setNivelAtividadeRotina] = useState<NivelAtividadeRotina>("MODERADO");
  const [alturaCm, setAlturaCm] = useState("");
  const [pesoAtualKg, setPesoAtualKg] = useState("");
  const [pesoObjetivoKg, setPesoObjetivoKg] = useState("");
  const [historicoLesoes, setHistoricoLesoes] = useState("");
  const [condicoesSaude, setCondicoesSaude] = useState("");
  const [medicacoes, setMedicacoes] = useState("");
  const [restricoesAlimentares, setRestricoesAlimentares] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [consentimento, setConsentimento] = useState(false);

  const readOnly = Boolean(user?.anamneseCompleted && existing);

  useEffect(() => {
    if (!user?.anamneseCompleted) {
      setLoadState("ready");
      return;
    }
    void anamneseApi
      .mine()
      .then((data) => {
        setExisting(data);
        setLoadState("ready");
      })
      .catch(() => {
        setLoadState("ready");
      });
  }, [user?.anamneseCompleted]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly) return;

    if (!consentimento) {
      setError("É necessário consentir o uso dos dados de saúde para continuar.");
      return;
    }

    const altura = parseInt(alturaCm, 10);
    const dias = parseInt(diasDisponiveisSemana, 10);
    if (!Number.isFinite(altura) || altura < 100 || altura > 250) {
      setError("Informe uma altura válida (100–250 cm).");
      return;
    }
    if (!Number.isFinite(dias) || dias < 1 || dias > 7) {
      setError("Informe quantos dias por semana você pode treinar (1–7).");
      return;
    }
    if (!pesoAtualKg.trim()) {
      setError("Informe seu peso atual.");
      return;
    }

    const body: AnamneseRequest = {
      objetivoPrincipal,
      experienciaTreino,
      diasDisponiveisSemana: dias,
      nivelAtividadeRotina,
      alturaCm: altura,
      pesoAtualKg: pesoAtualKg.trim().replace(",", "."),
      pesoObjetivoKg: pesoObjetivoKg.trim() ? pesoObjetivoKg.trim().replace(",", ".") : null,
      historicoLesoes: historicoLesoes.trim() || null,
      condicoesSaude: condicoesSaude.trim() || null,
      medicacoes: medicacoes.trim() || null,
      restricoesAlimentares: restricoesAlimentares.trim() || null,
      observacoes: observacoes.trim() || null,
      consentimentoDadosSaude: true,
    };

    setError(null);
    setSubmitting(true);
    try {
      await anamneseApi.create(body);
      await refreshUser();
      navigate("/student", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar a anamnese.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === "loading") {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
          <ClipboardList className="size-6 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Anamnese</h1>
        <p className="text-sm text-muted-foreground">
          {readOnly
            ? "Seus dados de saúde e objetivos — revisão somente leitura."
            : "Antes de acessar treinos, conte um pouco sobre você. Seus dados ficam visíveis apenas ao seu criador."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{readOnly ? "Sua anamnese" : "Questionário inicial"}</CardTitle>
          <CardDescription>
            Informações de saúde são dados sensíveis (LGPD). Não substituem avaliação médica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="objetivo">Objetivo principal</Label>
                <select
                  id="objetivo"
                  className={selectClass}
                  value={readOnly ? existing?.objetivoPrincipal : objetivoPrincipal}
                  onChange={(e) => setObjetivoPrincipal(e.target.value as ObjetivoPrincipal)}
                  disabled={readOnly}
                  required
                >
                  {objetivoPrincipalOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="experiencia">Experiência com treino</Label>
                <select
                  id="experiencia"
                  className={selectClass}
                  value={readOnly ? existing?.experienciaTreino : experienciaTreino}
                  onChange={(e) => setExperienciaTreino(e.target.value as ExperienciaTreino)}
                  disabled={readOnly}
                  required
                >
                  {experienciaTreinoOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dias">Dias disponíveis / semana</Label>
                <Input
                  id="dias"
                  type="number"
                  min={1}
                  max={7}
                  value={readOnly ? existing?.diasDisponiveisSemana : diasDisponiveisSemana}
                  onChange={(e) => setDiasDisponiveisSemana(e.target.value)}
                  disabled={readOnly}
                  required
                  className="h-11 rounded-[11px]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="atividade">Nível de atividade no dia a dia</Label>
                <select
                  id="atividade"
                  className={selectClass}
                  value={readOnly ? existing?.nivelAtividadeRotina : nivelAtividadeRotina}
                  onChange={(e) => setNivelAtividadeRotina(e.target.value as NivelAtividadeRotina)}
                  disabled={readOnly}
                  required
                >
                  {nivelAtividadeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  min={100}
                  max={250}
                  value={readOnly ? existing?.alturaCm : alturaCm}
                  onChange={(e) => setAlturaCm(e.target.value)}
                  disabled={readOnly}
                  required
                  className="h-11 rounded-[11px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="peso">Peso atual (kg)</Label>
                <Input
                  id="peso"
                  inputMode="decimal"
                  value={readOnly ? existing?.pesoAtualKg : pesoAtualKg}
                  onChange={(e) => setPesoAtualKg(e.target.value)}
                  disabled={readOnly}
                  required
                  className="h-11 rounded-[11px]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="peso-obj">Peso objetivo (kg) — opcional</Label>
                <Input
                  id="peso-obj"
                  inputMode="decimal"
                  value={readOnly ? (existing?.pesoObjetivoKg ?? "") : pesoObjetivoKg}
                  onChange={(e) => setPesoObjetivoKg(e.target.value)}
                  disabled={readOnly}
                  className="h-11 rounded-[11px]"
                />
              </div>
            </div>

            {(
              [
                ["lesoes", "Histórico de lesões", historicoLesoes, setHistoricoLesoes, existing?.historicoLesoes],
                ["saude", "Condições de saúde", condicoesSaude, setCondicoesSaude, existing?.condicoesSaude],
                ["med", "Medicações", medicacoes, setMedicacoes, existing?.medicacoes],
                ["alim", "Restrições alimentares", restricoesAlimentares, setRestricoesAlimentares, existing?.restricoesAlimentares],
                ["obs", "Observações", observacoes, setObservacoes, existing?.observacoes],
              ] as const
            ).map(([id, label, value, setter, existingVal]) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <textarea
                  id={id}
                  rows={3}
                  value={readOnly ? (existingVal ?? "") : value}
                  onChange={(e) => setter(e.target.value)}
                  disabled={readOnly}
                  className="w-full rounded-[11px] border border-border bg-secondary/40 px-3.5 py-2.5 text-sm transition-colors focus:border-primary/60 focus:outline-none focus:ring-[3px] focus:ring-primary/15"
                  placeholder="Opcional"
                />
              </div>
            ))}

            {!readOnly ? (
              <label
                htmlFor="consent"
                className="flex cursor-pointer items-start gap-3 rounded-[11px] border border-border bg-secondary/30 p-4"
              >
                <input
                  id="consent"
                  type="checkbox"
                  checked={consentimento}
                  onChange={(e) => setConsentimento(e.target.checked)}
                  disabled={submitting}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span className="text-sm leading-relaxed">
                  Autorizo o uso destes dados de saúde pelo meu criador no FitRadar para personalizar
                  treinos e acompanhamento, conforme a Política de Privacidade.
                </span>
              </label>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {readOnly ? (
                <Button type="button" onClick={() => navigate("/student", { replace: true })}>
                  Voltar ao início
                </Button>
              ) : (
                <Button type="submit" disabled={submitting || !consentimento} className="min-w-[160px]">
                  {submitting ? "Salvando…" : "Concluir anamnese"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
