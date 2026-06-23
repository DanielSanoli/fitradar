import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { localDateKey } from "@/lib/student/date-utils";

const DAY_LABELS = ["Dom", "Seg", "", "Qua", "", "Sex", ""] as const;
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function heatColor(intensity: number): string {
  if (intensity <= 0) return "hsl(215 16% 18%)";
  if (intensity < 0.4) return "hsl(165 76% 48% / 0.28)";
  if (intensity < 0.72) return "hsl(165 76% 48% / 0.58)";
  return "hsl(165 76% 48%)";
}

type CheckInHeatmapProps = {
  doneDates: string[];
  totalLabel: string;
  className?: string;
};

export function CheckInHeatmap({ doneDates, totalLabel, className }: CheckInHeatmapProps) {
  const { cells, monthLabels } = useMemo(() => {
    const today = new Date();
    const dateSet = new Set(doneDates);
    const grid: { key: string; intensity: number }[] = [];

    for (let w = 0; w < 12; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(today);
        cellDate.setDate(cellDate.getDate() - ((11 - w) * 7 + (6 - d)));
        const key = localDateKey(cellDate);
        grid.push({ key, intensity: dateSet.has(key) ? 1 : 0 });
      }
    }

    const labels: { label: string; span: number }[] = [];
    let lastMonth = -1;
    let colOffset = 0;
    for (let w = 0; w < 12; w++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (11 - w) * 7);
      const m = d.getMonth();
      if (m !== lastMonth) {
        if (lastMonth !== -1 && labels.length) {
          labels[labels.length - 1].span = w - colOffset;
        }
        labels.push({ label: MONTHS[m], span: 1 });
        colOffset = w;
        lastMonth = m;
      }
    }
    if (labels.length) labels[labels.length - 1].span = 12 - colOffset;

    return { cells: grid, monthLabels: labels };
  }, [doneDates]);

  return (
    <div className={cn("overflow-hidden rounded-[14px] border border-border bg-card shadow-lg", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-[15px] font-bold">Histórico de check-ins</p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Últimas 12 semanas</p>
        </div>
        <span className="text-[13px] text-muted-foreground">{totalLabel}</span>
      </div>

      <div className="overflow-x-auto px-5 py-5">
        <div className="flex min-w-[320px] items-start gap-4">
          <div className="flex flex-col gap-[3px] pt-0.5">
            {DAY_LABELS.map((label, i) => (
              <span
                key={i}
                className="flex h-[13px] items-center text-[10px] text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex gap-[3px]">
              {monthLabels.map((ml) => (
                <div
                  key={ml.label}
                  style={{ width: ml.span * 13 + (ml.span - 1) * 3 }}
                  className="shrink-0"
                >
                  <span className="text-[10px] text-muted-foreground">{ml.label}</span>
                </div>
              ))}
            </div>
            <div
              className="grid gap-[3px]"
              style={{
                gridTemplateRows: "repeat(7, 13px)",
                gridAutoFlow: "column",
                gridAutoColumns: "13px",
              }}
            >
              {cells.map((cell, i) => (
                <div
                  key={`${cell.key}-${i}`}
                  className="size-[13px] rounded-[3px]"
                  style={{ background: heatColor(cell.intensity) }}
                  title={cell.key}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Menos</span>
              <div className="size-[13px] rounded-[3px] bg-[hsl(215_16%_18%)]" />
              <div className="size-[13px] rounded-[3px] bg-[hsl(165_76%_48%/0.3)]" />
              <div className="size-[13px] rounded-[3px] bg-[hsl(165_76%_48%/0.6)]" />
              <div className="size-[13px] rounded-[3px] bg-[hsl(165_76%_48%)]" />
              <span>Mais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckInHeatmapEmpty({
  studentName,
  onReminder,
}: {
  studentName: string;
  onReminder: () => void;
}) {
  const firstName = studentName.split(" ")[0] ?? studentName;

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-[15px] font-bold">Histórico de check-ins</p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Últimas 12 semanas</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="flex size-[52px] items-center justify-center rounded-[14px] border border-dashed border-border">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-muted-foreground"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <p className="text-[17px] font-bold">Sem check-ins ainda</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {firstName} entrou recentemente. O histórico aparece assim que o primeiro treino for
            registrado.
          </p>
        </div>
        <ButtonReminder onClick={onReminder} />
      </div>
    </div>
  );
}

function ButtonReminder({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[42px] rounded-[10px] border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
    >
      Enviar lembrete de boas-vindas
    </button>
  );
}
