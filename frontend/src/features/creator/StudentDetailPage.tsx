import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, TriangleAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CheckInHistorySummary } from "@/components/creator/CheckInHistorySummary";
import { ReminderModal } from "@/components/creator/ReminderModal";
import { StudentAnamnesePanel } from "@/components/creator/StudentAnamnesePanel";
import { StudentAvatar } from "@/components/creator/StudentAvatar";
import { AdherenceRing } from "@/components/fitness/AdherenceRing";
import { StreakFlame } from "@/components/fitness/StreakFlame";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { copilotApi } from "@/lib/api/copilot-api";
import { anamneseApi } from "@/lib/api/anamnese-api";
import { gamificationApi } from "@/lib/api/gamification-api";
import { retentionApi } from "@/lib/api/retention-api";
import { studentsApi } from "@/lib/api/students-api";
import type {
  AnamneseResponse,
  ChurnRiskResult,
  EnrollmentResponse,
  StudentProgressResult,
  StudentResponse,
} from "@/lib/api/domain-types";
import { formatAdherence } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import {
  adherenceBarColor,
  formatJoinedStr,
  formatLastActivity,
  inactiveDisplayValue,
  parseInactiveDays,
  riskUi,
  streakSubtitle,
} from "@/lib/creator/display-utils";

function blockErrorMessage(reason: unknown): string {
  return reason instanceof ApiError ? reason.message : "Indisponível no momento.";
}

export function StudentDetailPage() {
  const { toast } = useToast();
  const { id = "" } = useParams();
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [risk, setRisk] = useState<ChurnRiskResult | null>(null);
  const [progress, setProgress] = useState<StudentProgressResult | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [nudge, setNudge] = useState<string | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeError, setNudgeError] = useState<string>();
  const [showReminder, setShowReminder] = useState(false);
  const [riskWarning, setRiskWarning] = useState<string>();
  const [progressWarning, setProgressWarning] = useState<string>();
  const [enrollWarning, setEnrollWarning] = useState<string>();
  const [leaderboardWarning, setLeaderboardWarning] = useState<string>();
  const [anamnese, setAnamnese] = useState<AnamneseResponse | null>(null);
  const [anamneseError, setAnamneseError] = useState<string>();

  usePageTitle(student?.name ?? null);

  const loadNudge = useCallback(async () => {
    if (!id) return null;
    setNudgeLoading(true);
    setNudgeError(undefined);
    try {
      const n = await copilotApi.nudge(id);
      setNudge(n.message);
      return n.message;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erro ao gerar lembrete.";
      setNudgeError(msg);
      return null;
    } finally {
      setNudgeLoading(false);
    }
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setState("loading");
    setRiskWarning(undefined);
    setProgressWarning(undefined);
    setEnrollWarning(undefined);
    setLeaderboardWarning(undefined);
    setAnamneseError(undefined);
    setAnamnese(null);
    setNudgeError(undefined);

    const [sResult, rResult, pResult, eResult, lbResult, aResult] = await Promise.allSettled([
      studentsApi.get(id),
      retentionApi.studentRisk(id),
      retentionApi.studentProgress(id),
      studentsApi.enrollments(id),
      gamificationApi.leaderboard(),
      anamneseApi.forStudent(id),
    ]);

    if (sResult.status === "rejected") {
      setError(blockErrorMessage(sResult.reason));
      setState("error");
      return;
    }

    setStudent(sResult.value);
    setRisk(rResult.status === "fulfilled" ? rResult.value : null);
    if (rResult.status === "rejected") setRiskWarning(blockErrorMessage(rResult.reason));

    setProgress(pResult.status === "fulfilled" ? pResult.value : null);
    if (pResult.status === "rejected") setProgressWarning(blockErrorMessage(pResult.reason));

    setEnrollments(eResult.status === "fulfilled" ? eResult.value : []);
    if (eResult.status === "rejected") setEnrollWarning(blockErrorMessage(eResult.reason));

    if (lbResult.status === "fulfilled") {
      const entry = lbResult.value.find((e) => e.studentId === id);
      setTotalCheckIns(entry?.totalCheckInsDone ?? 0);
    } else {
      setTotalCheckIns(0);
      setLeaderboardWarning(blockErrorMessage(lbResult.reason));
    }

    if (aResult.status === "fulfilled") {
      setAnamnese(aResult.value);
    } else if (aResult.reason instanceof ApiError && aResult.reason.status === 404) {
      setAnamnese(null);
    } else if (aResult.status === "rejected") {
      setAnamneseError(blockErrorMessage(aResult.reason));
    }

    setState("content");
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (state === "content" && id) {
      void loadNudge();
    }
  }, [state, id, loadNudge]);

  const openReminder = async () => {
    if (!nudge) {
      const text = await loadNudge();
      if (!text) return;
    }
    setShowReminder(true);
  };

  const sendReminder = async (text: string) => {
    if (!id) {
      throw new Error("Aluno não encontrado.");
    }
    const result = await copilotApi.sendNudge(id, text);
    toast(result.summary);
    return result;
  };

  const programTitle = enrollments.find((e) => e.active)?.programTitle ?? "Sem programa";
  const inactiveDays = parseInactiveDays(risk?.assumptions);
  const lastActivity = formatLastActivity(inactiveDays, totalCheckIns > 0);
  const inactive = inactiveDisplayValue(inactiveDays);
  const uiLevel = risk ? riskUi(risk.level) : null;
  const isNew = totalCheckIns === 0;
  const adherenceColor = adherenceBarColor(progress?.adherence);
  const adherencePct = progress?.adherence
    ? `${Math.min(100, Math.max(0, parseFloat(progress.adherence) || 0))}%`
    : "0%";
  const streak = progress?.currentStreak ?? 0;
  const weeklyDone = progress?.weeklyDone ?? 0;
  const showRiskPanel =
    risk && uiLevel && (risk.level === "MEDIUM" || risk.level === "HIGH");

  const statCards = useMemo(
    () => [
      {
        key: "adherence",
        label: "Aderência",
      },
      {
        key: "streak",
        label: "Sequência atual",
      },
      {
        key: "checkins",
        label: "Check-ins totais",
        value: String(totalCheckIns),
        unit: "registros",
        sub: formatJoinedStr(student?.createdAt ?? new Date().toISOString()),
      },
      {
        key: "activity",
        label: "Última atividade",
        value: inactive.value,
        unit: inactive.unit,
        sub: lastActivity.label,
        valueColor: inactive.color,
      },
    ],
    [totalCheckIns, student, inactive, lastActivity.label],
  );

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 animate-in fade-in duration-300">
      <Button variant="outline" size="sm" asChild className="h-9 w-fit gap-2 rounded-[9px]">
        <Link to="/app/students">
          <ChevronLeft className="size-4" aria-hidden />
          Voltar para alunos
        </Link>
      </Button>

      <PanelState state={state} message={error} onRetry={load}>
        {student ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-5 rounded-[14px] border border-border bg-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] md:p-6">
              <div className="flex items-center gap-4">
                <StudentAvatar name={student.name} size="md" />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-[22px] font-extrabold tracking-tight">{student.name}</h1>
                    {isNew ? (
                      <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        Novo
                      </span>
                    ) : uiLevel ? (
                      <RiskBadge level={uiLevel} />
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-[13.5px] text-muted-foreground">
                    <span>{programTitle}</span>
                    <span className="size-1 rounded-full bg-muted-foreground/40" aria-hidden />
                    <span>Entrou {formatJoinedStr(student.createdAt)}</span>
                    <span className="size-1 rounded-full bg-muted-foreground/40" aria-hidden />
                    <span>Última atividade: {lastActivity.label}</span>
                  </div>
                </div>
              </div>
              <Button
                className="h-11 gap-2 rounded-[11px] shadow-[0_4px_18px_hsl(var(--primary)/0.28)]"
                onClick={() => void openReminder()}
                disabled={nudgeLoading}
              >
                <Bell className="size-4" strokeWidth={2.5} aria-hidden />
                Enviar lembrete
              </Button>
            </div>

            {enrollWarning ? (
              <Alert variant="destructive">
                <AlertDescription>Matrículas: {enrollWarning}</AlertDescription>
              </Alert>
            ) : null}
            {progressWarning ? (
              <Alert variant="destructive">
                <AlertDescription>Progresso: {progressWarning}</AlertDescription>
              </Alert>
            ) : null}
            {leaderboardWarning ? (
              <Alert>
                <AlertDescription>Check-ins totais: {leaderboardWarning}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => (
                <div
                  key={card.key}
                  className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-card p-5"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </span>

                  {card.key === "adherence" ? (
                    <div className="flex items-center gap-4">
                      <AdherenceRing
                        value={progress?.adherence ?? null}
                        size="compact"
                        strokeColor={adherenceColor}
                        periodLabel="30 dias"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[34px] font-extrabold leading-none tracking-tight"
                          style={{ color: adherenceColor }}
                        >
                          {formatAdherence(progress?.adherence)}
                        </p>
                        <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full"
                            style={{ width: adherencePct, background: adherenceColor }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {card.key === "streak" ? (
                    <StreakFlame
                      streak={streak}
                      label="dias"
                      subtitle={streakSubtitle(streak)}
                      variant="prominent"
                    />
                  ) : null}

                  {card.key !== "adherence" && card.key !== "streak" ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-[34px] font-extrabold leading-none tracking-tight"
                          style={card.valueColor ? { color: card.valueColor } : undefined}
                        >
                          {card.value}
                        </span>
                        {card.unit ? (
                          <span className="text-[15px] text-muted-foreground">{card.unit}</span>
                        ) : null}
                      </div>
                      {card.sub ? (
                        <span className="text-[12.5px] text-muted-foreground">{card.sub}</span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ))}
            </div>

            <StudentAnamnesePanel anamnese={anamnese} error={anamneseError} />

            {showRiskPanel ? (
              <div className="overflow-hidden rounded-[14px] border border-destructive/30 bg-destructive/5">
                <div className="flex flex-wrap items-center gap-3 border-b border-destructive/20 px-5 py-4">
                  <TriangleAlert className="size-[18px] text-destructive" aria-hidden />
                  <span className="text-[15px] font-bold">Motivos do alerta do Radar</span>
                  <RiskBadge level={uiLevel!} />
                </div>
                <ul className="space-y-2.5 px-5 py-4">
                  {(risk.assumptions ?? []).map((reason) => (
                    <li key={reason} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive"
                        aria-hidden
                      />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : riskWarning ? (
              <Alert variant="destructive">
                <AlertDescription>Risco: {riskWarning}</AlertDescription>
              </Alert>
            ) : null}

            <CheckInHistorySummary
              studentName={student.name}
              totalCheckIns={totalCheckIns}
              weeklyDone={weeklyDone}
              onReminder={() => void openReminder()}
            />

            <div className="overflow-hidden rounded-[14px] border border-primary/25 bg-gradient-to-br from-primary/10 to-card">
              <div className="flex items-center gap-3 border-b border-primary/20 px-5 py-4">
                <span
                  className="flex size-8 items-center justify-center rounded-[9px] border border-primary/30 bg-primary/10"
                  aria-hidden
                >
                  <span className="size-2.5 rotate-45 rounded-sm bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                </span>
                <div>
                  <p className="text-[15px] font-bold">Lembrete sugerido pelo Radar</p>
                  <p className="text-xs text-muted-foreground">Personalizado para {student.name}</p>
                </div>
              </div>
              <div className="space-y-3.5 px-5 py-4">
                {nudgeError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{nudgeError}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="rounded-[12px] border border-border bg-secondary/40 p-4 text-sm leading-relaxed">
                  {nudgeLoading && !nudge
                    ? "Gerando sugestão com base nos dados de treino…"
                    : (nudge ??
                      "Sugestão indisponível no momento. Tente novamente em instantes.")}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    className="shadow-[0_4px_14px_hsl(var(--primary)/0.25)]"
                    onClick={() => void openReminder()}
                    disabled={nudgeLoading || !nudge}
                  >
                    Revisar e enviar
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Você pode editar antes de enviar
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sugestão, não orientação médica/profissional.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </PanelState>

      <ReminderModal
        open={showReminder}
        studentName={student?.name ?? ""}
        initialText={nudge ?? ""}
        loading={nudgeLoading}
        onClose={() => setShowReminder(false)}
        onSend={sendReminder}
      />
    </div>
  );
}
