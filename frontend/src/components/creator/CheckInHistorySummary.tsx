import { Activity } from "lucide-react";
import { CheckInHeatmapEmpty } from "@/components/creator/CheckInHeatmap";

type CheckInHistorySummaryProps = {
  studentName: string;
  totalCheckIns: number;
  weeklyDone: number;
  onReminder: () => void;
};

/**
 * Check-in history for creator view — aggregates from retention/gamification DTOs only.
 * Per-day heatmap requires check-in dates not exposed on the creator API.
 */
export function CheckInHistorySummary({
  studentName,
  totalCheckIns,
  weeklyDone,
  onReminder,
}: CheckInHistorySummaryProps) {
  if (totalCheckIns === 0) {
    return <CheckInHeatmapEmpty studentName={studentName} onReminder={onReminder} />;
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-[15px] font-bold">Histórico de check-ins</p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Resumo dos últimos 7 dias</p>
        </div>
        <span className="text-[13px] text-muted-foreground">
          {totalCheckIns} registros no total
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:text-left">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-[14px] border border-primary/30 bg-primary/10"
          aria-hidden
        >
          <Activity className="size-7 text-primary" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[17px] font-bold">
            {weeklyDone} treino{weeklyDone === 1 ? "" : "s"} esta semana
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Totais e aderência vêm do motor de retenção. O mapa diário detalhado está disponível
            na visão do aluno.
          </p>
        </div>
      </div>
    </div>
  );
}
