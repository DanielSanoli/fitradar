import { Activity } from "lucide-react";
import type { AdherenceTrendPoint, CreatorAdherenceTrendResult } from "@/lib/api/domain-types";
import { formatAdherence } from "@/lib/api/domain-types";
import {
  adherenceTrendHasSeries,
  formatChangeDelta,
  formatWeekLabel,
  trendFromChange,
} from "@/lib/creator/retention-utils";
import { adherenceBarColor } from "@/lib/creator/display-utils";
import { PanelState } from "@/components/ui/PanelState";
import { cn } from "@/lib/utils";

type AdherenceTrendPanelProps = {
  trend: CreatorAdherenceTrendResult | null;
  loadState: "loading" | "error" | "content";
  errorMessage?: string;
  onRetry: () => void;
};

function WeeklyBarChart({ series }: { series: AdherenceTrendPoint[] }) {
  const points = series.filter((p) => p.avgAdherence != null);
  if (points.length < 2) return null;

  const values = points.map((p) => parseFloat(p.avgAdherence!));
  const max = Math.max(...values, 1);

  return (
    <div
      className="flex items-end gap-2 pt-2"
      role="img"
      aria-label="Gráfico de aderência semanal da comunidade"
    >
      {points.map((point) => {
        const value = parseFloat(point.avgAdherence!);
        const heightPct = Math.max(8, (value / max) * 100);
        const color = adherenceBarColor(point.avgAdherence);
        return (
          <div key={point.weekStart} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
              {Math.round(value)}%
            </span>
            <div
              className="flex w-full max-w-[48px] items-end justify-center"
              style={{ height: 88 }}
              aria-hidden
            >
              <div
                className="w-full max-w-[36px] rounded-t-md transition-all"
                style={{
                  height: `${heightPct}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}88)`,
                  boxShadow: `0 0 12px ${color}44`,
                }}
              />
            </div>
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {formatWeekLabel(point.weekStart)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AdherenceTrendPanel({
  trend,
  loadState,
  errorMessage,
  onRetry,
}: AdherenceTrendPanelProps) {
  const hasSeries = adherenceTrendHasSeries(trend);
  const currentDisplay = formatAdherence(trend?.currentPeriodAdherence);
  const previousDisplay = formatAdherence(trend?.previousPeriodAdherence);
  const delta = formatChangeDelta(trend?.changePoints);
  const trendDir = trendFromChange(trend?.changePoints);

  const trendColor =
    trendDir === "up"
      ? "text-[hsl(165_70%_58%)]"
      : trendDir === "down"
        ? "text-[hsl(0_75%_72%)]"
        : "text-muted-foreground";

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 md:px-[22px]">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" aria-hidden />
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Tendência de aderência
            </h2>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Evolução da comunidade — números calculados pelo motor de retenção.
          </p>
        </div>
        {loadState === "content" && delta ? (
          <span className={cn("text-[13px] font-bold", trendColor)}>{delta}</span>
        ) : null}
      </div>

      <PanelState
        state={loadState === "content" ? "content" : loadState}
        message={errorMessage}
        onRetry={onRetry}
        rows={4}
        className="px-5 py-5 md:px-[22px]"
      >
        {hasSeries ? (
          <WeeklyBarChart series={trend!.weeklySeries} />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Últimos 30 dias
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                  {currentDisplay}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  30 dias anteriores
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-muted-foreground">
                  {previousDisplay}
                </p>
              </div>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              {trend?.weeklySeries?.length
                ? "Série histórica insuficiente para gráfico — exibindo comparação entre períodos."
                : "Sem dados suficientes para série histórica. Convide alunos e aguarde check-ins."}
            </p>
          </div>
        )}

        {trend?.assumptions?.length ? (
          <p className="mt-4 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
            {trend.assumptions[0]}
          </p>
        ) : null}
      </PanelState>
    </div>
  );
}
