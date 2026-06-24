import { useState } from "react";
import { Bell, Check, Copy, Flame, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ReminderModal } from "@/components/creator/ReminderModal";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { copilotApi } from "@/lib/api/copilot-api";
import type { ChurnRiskResult, RiskLevel } from "@/lib/api/domain-types";
import { riskLevelToUi } from "@/lib/api/domain-types";
import { attentionSubtitle, type DashboardAttentionState } from "@/lib/creator/dashboard-copy";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const LEVEL_ORDER: Record<RiskLevel, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function riskReason(student: ChurnRiskResult): string {
  const first = student.assumptions?.[0]?.trim();
  return first || "Sinais de queda na retenção";
}

function sortBySeverity(students: ChurnRiskResult[]): ChurnRiskResult[] {
  return [...students].sort(
    (a, b) =>
      LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level] || b.score - a.score,
  );
}

type AttentionTodayPanelProps = {
  state: DashboardAttentionState;
  atRisk: ChurnRiskResult[];
  riskCount: number;
  spaceLink: string | null;
  loadState: "loading" | "error" | "content";
  errorMessage?: string;
  onRetry: () => void;
  onCelebrate?: () => void;
};

export function AttentionTodayPanel({
  state,
  atRisk,
  riskCount,
  spaceLink,
  loadState,
  errorMessage,
  onRetry,
  onCelebrate,
}: AttentionTodayPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());
  const [reminderTarget, setReminderTarget] = useState<ChurnRiskResult | null>(null);
  const [reminderText, setReminderText] = useState("");
  const [nudgeLoading, setNudgeLoading] = useState(false);

  const sorted = sortBySeverity(atRisk);

  const openReminder = async (student: ChurnRiskResult) => {
    setNudgeLoading(true);
    try {
      const nudge = await copilotApi.nudge(student.studentId);
      setReminderText(nudge.message);
      setReminderTarget(student);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao gerar lembrete.", "error");
    } finally {
      setNudgeLoading(false);
    }
  };

  const confirmReminder = async () => {
    if (!reminderTarget) return;
    setSentIds((prev) => new Set(prev).add(reminderTarget.studentId));
    toast("Lembrete registrado. Envie pelo canal preferido do aluno.");
  };

  const copyLink = async () => {
    const url = spaceLink
      ? `${window.location.protocol}//${spaceLink}`
      : `${window.location.origin}/login`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copiado.");
    } catch {
      toast("Não foi possível copiar o link.", "error");
    }
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5 md:px-[22px]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold tracking-tight text-foreground">Atenção hoje</h2>
              {state === "alerts" && riskCount > 0 ? (
                <span
                  className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full border border-[hsl(var(--risk-high)/0.34)] bg-[hsl(var(--risk-high)/0.16)] px-1.5 text-xs font-bold text-[hsl(0_82%_80%)]"
                  aria-label={`${riskCount} alunos em risco`}
                >
                  {riskCount}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">{attentionSubtitle(state)}</p>
          </div>
          {state === "alerts" ? (
            <Link
              to="/app/retention"
              className="shrink-0 text-[13px] font-semibold text-primary hover:underline"
            >
              Ver todos →
            </Link>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col px-3 py-2 pb-3">
          {state === "empty" ? (
            <div className="flex flex-col items-center gap-4 px-4 py-10 text-center md:py-9">
              <div
                className="relative flex size-[72px] items-center justify-center rounded-full border border-border"
                aria-hidden
              >
                <span className="absolute size-12 rounded-full border border-primary/30" />
                <span className="absolute size-6 rounded-full border border-primary/45" />
                <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
              </div>
              <div>
                <p className="text-[19px] font-bold tracking-tight text-foreground">
                  Você ainda não tem alunos
                </p>
                <p className="mx-auto mt-1.5 max-w-[400px] text-sm leading-relaxed text-muted-foreground">
                  Convide seu primeiro aluno para o Radar começar a monitorar treinos, check-ins e
                  sinais de risco.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Button
                  className="h-11 shadow-[0_4px_16px_hsl(var(--primary)/0.25)]"
                  onClick={() => navigate("/app/students")}
                >
                  <UserPlus className="size-4" aria-hidden />
                  Convidar primeiro aluno
                </Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => void copyLink()}>
                  <Copy className="size-4" aria-hidden />
                  Copiar link
                </Button>
              </div>
              {spaceLink ? (
                <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-[10px] border border-dashed border-border bg-secondary/40 px-3.5 py-2.5 font-mono text-[12.5px] text-muted-foreground">
                  <span className="truncate">{spaceLink}</span>
                  <button
                    type="button"
                    className="shrink-0 font-sans text-[12.5px] font-semibold text-primary hover:underline"
                    onClick={() => void copyLink()}
                  >
                    copiar
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {state === "positive" ? (
            <div className="flex flex-col items-center gap-4 px-4 py-11 text-center md:py-10">
              <div className="relative flex size-[68px] items-center justify-center rounded-[20px] border border-primary/30 bg-primary/10">
                <div
                  className="absolute -inset-2.5 rounded-[28px] bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_70%)]"
                  aria-hidden
                />
                <Check className="relative size-8 text-primary" strokeWidth={2.5} aria-hidden />
              </div>
              <div>
                <p className="text-[19px] font-bold tracking-tight text-foreground">
                  Ninguém em risco hoje
                </p>
                <p className="mx-auto mt-1.5 max-w-[380px] text-sm leading-relaxed text-muted-foreground">
                  Toda a sua comunidade está ativa e aderente. Aproveite para reconhecer quem está
                  mandando bem.
                </p>
              </div>
              <Button
                className="h-11 shadow-[0_4px_16px_hsl(var(--primary)/0.25)]"
                onClick={onCelebrate}
              >
                Enviar um parabéns coletivo
              </Button>
            </div>
          ) : null}

          {state === "alerts" ? (
            <PanelState
              state={loadState === "content" ? "content" : loadState}
              message={errorMessage}
              onRetry={onRetry}
              rows={3}
            >
              <ul className="flex flex-col gap-0.5" aria-label="Alunos que precisam de atenção">
                {sorted.slice(0, 5).map((student) => {
                  const sent = sentIds.has(student.studentId);
                  return (
                    <li
                      key={student.studentId}
                      className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/80 sm:flex-nowrap sm:gap-3.5"
                    >
                      <div className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-sm font-bold text-foreground">
                        {initials(student.studentName)}
                      </div>
                      <div className="min-w-0 flex-1 basis-[180px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/app/students/${student.studentId}`}
                            className="text-[14.5px] font-semibold text-foreground hover:underline"
                          >
                            {student.studentName}
                          </Link>
                          <RiskBadge level={riskLevelToUi(student.level)} />
                        </div>
                        <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-muted-foreground">
                          <Flame className="mt-0.5 size-3.5 shrink-0 text-[hsl(var(--risk-high))]" aria-hidden />
                          <span>{riskReason(student)}</span>
                        </p>
                      </div>
                      {sent ? (
                        <span
                          className={cn(
                            "inline-flex min-h-10 min-w-[158px] flex-1 items-center justify-center gap-1.5 text-[13px] font-semibold text-primary sm:flex-none",
                          )}
                        >
                          <Check className="size-4" strokeWidth={2.5} aria-hidden />
                          Lembrete enviado
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 min-w-[158px] flex-1 border-border bg-transparent text-[13px] font-semibold hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:flex-none"
                          disabled={nudgeLoading}
                          onClick={() => void openReminder(student)}
                        >
                          <Bell className="size-4" aria-hidden />
                          Enviar lembrete
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </PanelState>
          ) : null}
        </div>
      </div>

      <ReminderModal
        open={reminderTarget != null}
        studentName={reminderTarget?.studentName ?? ""}
        initialText={reminderText}
        loading={nudgeLoading}
        onClose={() => setReminderTarget(null)}
        onSend={confirmReminder}
      />
    </>
  );
}
