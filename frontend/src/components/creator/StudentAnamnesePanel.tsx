import type { AnamneseResponse } from "@/lib/api/domain-types";
import {
  labelExperienciaTreino,
  labelNivelAtividade,
  labelObjetivoPrincipal,
} from "@/lib/student/anamnese-labels";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function optionalText(value: string | null | undefined): React.ReactNode {
  if (!value?.trim()) return "—";
  return value;
}

type StudentAnamnesePanelProps = {
  anamnese: AnamneseResponse | null;
  loading?: boolean;
  error?: string;
};

export function StudentAnamnesePanel({ anamnese, loading, error }: StudentAnamnesePanelProps) {
  if (loading) {
    return (
      <div className="rounded-[14px] border border-border bg-card p-6 text-sm text-muted-foreground">
        Carregando anamnese…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[14px] border border-border bg-card p-6 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!anamnese) {
    return (
      <div className="rounded-[14px] border border-dashed border-border bg-secondary/20 p-6 text-center">
        <p className="text-sm font-semibold text-foreground">Anamnese</p>
        <p className="mt-2 text-sm text-muted-foreground">Aluno ainda não preencheu a anamnese.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-6 shadow-[0_8px_32px_rgba(0,0,0,0.22)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight">Anamnese</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Dados informados pelo aluno no primeiro acesso
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Objetivo" value={labelObjetivoPrincipal(anamnese.objetivoPrincipal)} />
        <Field label="Experiência" value={labelExperienciaTreino(anamnese.experienciaTreino)} />
        <Field
          label="Dias disponíveis / semana"
          value={`${anamnese.diasDisponiveisSemana} dia${anamnese.diasDisponiveisSemana === 1 ? "" : "s"}`}
        />
        <Field label="Atividade no dia a dia" value={labelNivelAtividade(anamnese.nivelAtividadeRotina)} />
        <Field label="Altura" value={`${anamnese.alturaCm} cm`} />
        <Field label="Peso atual" value={`${anamnese.pesoAtualKg} kg`} />
        <Field
          label="Peso objetivo"
          value={anamnese.pesoObjetivoKg ? `${anamnese.pesoObjetivoKg} kg` : "—"}
        />
      </div>

      <div className="mt-5 grid gap-4 border-t border-border/80 pt-5">
        <Field label="Histórico de lesões" value={optionalText(anamnese.historicoLesoes)} />
        <Field label="Condições de saúde" value={optionalText(anamnese.condicoesSaude)} />
        <Field label="Medicações" value={optionalText(anamnese.medicacoes)} />
        <Field label="Restrições alimentares" value={optionalText(anamnese.restricoesAlimentares)} />
        <Field label="Observações" value={optionalText(anamnese.observacoes)} />
      </div>
    </div>
  );
}
