import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarCheck,
  Check,
  Copy,
  Flame,
  HeartPulse,
  Search,
  UserPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdherenceTrendPanel } from "@/components/creator/AdherenceTrendPanel";
import { FilterPill } from "@/components/creator/FilterPill";
import { ReminderModal } from "@/components/creator/ReminderModal";
import { StudentAvatar } from "@/components/creator/StudentAvatar";
import { StudentListMetrics } from "@/components/creator/StudentListMetrics";
import { InsightCard } from "@/components/radar/InsightCard";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { copilotApi } from "@/lib/api/copilot-api";
import { gamificationApi } from "@/lib/api/gamification-api";
import { retentionApi } from "@/lib/api/retention-api";
import { spaceApi } from "@/lib/api/space-api";
import type {
  ChurnRiskResult,
  CreatorAdherenceTrendResult,
  CreatorOverviewResult,
  RiskLevel,
  StudentProgressResult,
} from "@/lib/api/domain-types";
import { formatAdherence, riskLevelToUi } from "@/lib/api/domain-types";
import {
  formatLastActivity,
  parseInactiveDays,
} from "@/lib/creator/display-utils";
import {
  formatChangeDelta,
  hasCheckInsFromAssumptions,
  riskReason,
  sortBySeverity,
  sparkFromWeeklySeries,
  trendFromChange,
} from "@/lib/creator/retention-utils";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type LevelFilter = "all" | RiskLevel;

type AtRiskRow = {
  risk: ChurnRiskResult;
  progress: StudentProgressResult | null;
  totalCheckIns: number;
  progressUnavailable: boolean;
};

type PageAttentionState = "empty" | "positive" | "alerts";

const LEVEL_FILTERS: { key: LevelFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "HIGH", label: "Alto" },
  { key: "MEDIUM", label: "Médio" },
  { key: "LOW", label: "Baixo" },
];

function deriveAttentionState(overview: CreatorOverviewResult | null): PageAttentionState {
  if (!overview || overview.activeStudents === 0) return "empty";
  if (overview.atRiskCount === 0) return "positive";
  return "alerts";
}

async function enrichAtRisk(
  risk: ChurnRiskResult,
  checkInsMap: Map<string, number>,
): Promise<AtRiskRow> {
  const progressResult = await Promise.allSettled([retentionApi.studentProgress(risk.studentId)]);
  const progress =
    progressResult[0].status === "fulfilled" ? progressResult[0].value : null;
  return {
    risk,
    progress,
    totalCheckIns: checkInsMap.get(risk.studentId) ?? 0,
    progressUnavailable: progressResult[0].status === "rejected",
  };
}

export function RetentionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [overview, setOverview] = useState<CreatorOverviewResult | null>(null);
  const [trend, setTrend] = useState<CreatorAdherenceTrendResult | null>(null);
  const [rows, setRows] = useState<AtRiskRow[]>([]);
  const [spaceLink, setSpaceLink] = useState<string | null>(null);

  const [overviewState, setOverviewState] = useState<"loading" | "error" | "content">("loading");
  const [trendState, setTrendState] = useState<"loading" | "error" | "content">("loading");
  const [listState, setListState] = useState<"loading" | "error" | "content">("loading");

  const [overviewError, setOverviewError] = useState<string>();
  const [trendError, setTrendError] = useState<string>();
  const [listError, setListError] = useState<string>();
  const [partialWarning, setPartialWarning] = useState<string>();

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set());
  const [reminderTarget, setReminderTarget] = useState<ChurnRiskResult | null>(null);
  const [reminderText, setReminderText] = useState("");
  const [nudgeLoading, setNudgeLoading] = useState(false);

  const loadOverview = useCallback(async () => {
    setOverviewState("loading");
    try {
      setOverview(await retentionApi.overview());
      setOverviewState("content");
    } catch (e) {
      setOverviewError(e instanceof ApiError ? e.message : "Erro ao carregar resumo.");
      setOverviewState("error");
    }
  }, []);

  const loadTrend = useCallback(async () => {
    setTrendState("loading");
    try {
      setTrend(await retentionApi.adherenceTrend());
      setTrendState("content");
    } catch (e) {
      setTrendError(e instanceof ApiError ? e.message : "Erro ao carregar tendência.");
      setTrendState("error");
    }
  }, []);

  const loadAtRisk = useCallback(async () => {
    setListState("loading");
    setPartialWarning(undefined);
    try {
      const [atRisk, leaderboard] = await Promise.all([
        retentionApi.studentsAtRisk("LOW"),
        gamificationApi.leaderboard().catch(() => []),
      ]);
      const checkInsMap = new Map(leaderboard.map((e) => [e.studentId, e.totalCheckInsDone]));
      const enriched = await Promise.all(atRisk.map((r) => enrichAtRisk(r, checkInsMap)));
      const partialCount = enriched.filter((r) => r.progressUnavailable).length;
      if (partialCount > 0) {
        setPartialWarning(
          `Aderência indisponível para ${partialCount} aluno(s). Os demais dados foram carregados.`,
        );
      }
      setRows(enriched);
      setListState("content");
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "Erro ao carregar alunos em risco.");
      setListState("error");
    }
  }, []);

  const loadSpace = useCallback(async () => {
    try {
      const space = await spaceApi.get();
      setSpaceLink(space.slug ? `${window.location.host}/c/${space.slug}` : null);
    } catch {
      setSpaceLink(null);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadTrend();
    void loadAtRisk();
    void loadSpace();
  }, [loadOverview, loadTrend, loadAtRisk, loadSpace]);

  const attention = deriveAttentionState(overview);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.map((r) => r.risk);
    if (levelFilter !== "all") {
      list = list.filter((r) => r.level === levelFilter);
    }
    if (q) {
      list = list.filter((r) => r.studentName.toLowerCase().includes(q));
    }
    const sorted = sortBySeverity(list);
    const rowMap = new Map(rows.map((r) => [r.risk.studentId, r]));
    return sorted.map((risk) => rowMap.get(risk.studentId)!);
  }, [rows, search, levelFilter]);

  const adhDisplay = formatAdherence(overview?.avgAdherence);
  const adhValue = adhDisplay === "—" ? "—" : adhDisplay.replace("%", "");
  const atRiskGlow =
    overview && overview.atRiskCount > 0
      ? "hsl(var(--glow-danger))"
      : overview && overview.activeStudents > 0
        ? "hsl(var(--glow-accent))"
        : "hsl(215 20% 40%)";

  const trendSpark = sparkFromWeeklySeries(trend?.weeklySeries ?? []);
  const trendDelta = formatChangeDelta(trend?.changePoints);

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
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-6 md:gap-[26px]">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-[27px]">
          Central de retenção
        </h1>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground md:text-[14.5px]">
          Visão profunda da saúde da comunidade — lista completa, filtros e tendência. O painel
          inicial mostra apenas o resumo.
        </p>
      </div>

      <section aria-labelledby="retention-summary-heading">
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <span
            className="size-2.5 rotate-45 rounded-sm bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
            aria-hidden
          />
          <h2 id="retention-summary-heading" className="text-sm font-bold text-foreground">
            Resumo
          </h2>
        </div>

        <PanelState
          state={overviewState === "content" ? "content" : overviewState}
          message={overviewError}
          onRetry={loadOverview}
          rows={3}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InsightCard
              label="Alunos em risco"
              value={overview?.atRiskCount ?? "—"}
              icon={Activity}
              riskLevel={
                overview && overview.activeStudents > 0
                  ? overview.atRiskCount > 0
                    ? riskLevelToUi("HIGH")
                    : riskLevelToUi("LOW")
                  : undefined
              }
              riskLabel={
                overview && overview.activeStudents > 0 && overview.atRiskCount === 0
                  ? "Tudo em dia"
                  : undefined
              }
              glowColor={atRiskGlow}
            />
            <InsightCard
              label="Aderência média"
              value={adhValue}
              unit={adhDisplay !== "—" ? "%" : ""}
              icon={HeartPulse}
              glowColor="hsl(var(--glow-accent))"
              delta={trendDelta}
              trend={trendFromChange(trend?.changePoints)}
              spark={trendSpark}
            />
            <InsightCard
              label="Check-ins na semana"
              value={overview?.checkInsThisWeek ?? "—"}
              icon={CalendarCheck}
              glowColor="hsl(var(--glow-accent))"
            />
          </div>
        </PanelState>
      </section>

      <section aria-labelledby="adherence-trend-heading">
        <h2 id="adherence-trend-heading" className="sr-only">
          Tendência de aderência
        </h2>
        <AdherenceTrendPanel
          trend={trend}
          loadState={trendState}
          errorMessage={trendError}
          onRetry={loadTrend}
        />
      </section>

      <section aria-labelledby="at-risk-list-heading">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="at-risk-list-heading" className="text-base font-bold text-foreground">
              Alunos em risco
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Lista completa · filtre por gravidade ou busque por nome
            </p>
          </div>
          {attention === "alerts" && overview ? (
            <span className="text-[13px] font-semibold text-muted-foreground">
              {overview.atRiskCount} no radar (nível médio ou acima no resumo)
            </span>
          ) : null}
        </div>

        {attention === "empty" ? (
          <div className="flex flex-col items-center gap-4 rounded-[14px] border border-border bg-card px-6 py-14 text-center shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
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
                Convide alunos para o Radar monitorar aderência, check-ins e sinais de risco.
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
          </div>
        ) : null}

        {attention === "positive" ? (
          <div className="flex flex-col items-center gap-4 rounded-[14px] border border-primary/25 bg-card px-6 py-14 text-center shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <div className="relative flex size-[68px] items-center justify-center rounded-[20px] border border-primary/30 bg-primary/10">
              <div
                className="absolute -inset-2.5 rounded-[28px] bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_70%)]"
                aria-hidden
              />
              <Check className="relative size-8 text-primary" strokeWidth={2.5} aria-hidden />
            </div>
            <div>
              <p className="text-[19px] font-bold tracking-tight text-foreground">
                Ninguém em risco
              </p>
              <p className="mx-auto mt-1.5 max-w-[380px] text-sm leading-relaxed text-muted-foreground">
                Toda a comunidade está aderente. Continue acompanhando a tendência acima.
              </p>
            </div>
          </div>
        ) : null}

        {attention === "alerts" ? (
          <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {partialWarning ? (
              <p className="border-b border-border bg-secondary/30 px-5 py-2.5 text-xs text-muted-foreground">
                {partialWarning}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-4">
              <div className="relative min-w-[220px] max-w-[360px] flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar aluno…"
                  aria-label="Buscar aluno em risco"
                  className="h-[42px] w-full rounded-[10px] border border-border bg-secondary/40 py-0 pl-10 pr-3.5 text-sm transition-colors focus:border-primary/60 focus:outline-none focus:ring-[3px] focus:ring-primary/15"
                />
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por nível de risco">
                {LEVEL_FILTERS.map((f) => (
                  <FilterPill
                    key={f.key}
                    label={f.label}
                    active={levelFilter === f.key}
                    onClick={() => setLevelFilter(f.key)}
                  />
                ))}
              </div>
            </div>

            <PanelState
              state={listState === "content" ? "content" : listState}
              message={listError}
              onRetry={loadAtRisk}
              rows={5}
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
                  <Search className="size-10 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                  <p className="text-[17px] font-bold">Nenhum aluno encontrado</p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Tente outro nome ou limpe os filtros.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setLevelFilter("all");
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border/80" aria-label="Lista completa de alunos em risco">
                  {filtered.map((row) => {
                    const { risk, progress, totalCheckIns } = row;
                    const inactive = parseInactiveDays(risk.assumptions);
                    const hasCheckIns =
                      totalCheckIns > 0 || hasCheckInsFromAssumptions(risk.assumptions);
                    const last = formatLastActivity(inactive, hasCheckIns);
                    const sent = sentIds.has(risk.studentId);

                    return (
                      <li
                        key={risk.studentId}
                        className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/40 sm:flex-nowrap"
                      >
                        <Link
                          to={`/app/students/${risk.studentId}`}
                          className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Ver detalhes de ${risk.studentName}`}
                        >
                          <StudentAvatar name={risk.studentName} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-[14.5px] font-semibold">
                                {risk.studentName}
                              </span>
                              <RiskBadge level={riskLevelToUi(risk.level)} />
                            </div>
                            <p className="mt-1 flex items-start gap-1.5 text-[13px] text-muted-foreground">
                              <Flame
                                className="mt-0.5 size-3.5 shrink-0 text-[hsl(var(--risk-high))]"
                                aria-hidden
                              />
                              <span>{riskReason(risk)}</span>
                            </p>
                          </div>
                        </Link>

                        <div className="w-full min-w-[120px] sm:w-auto sm:max-w-[140px]">
                          <StudentListMetrics
                            adherence={progress?.adherence}
                            streak={progress?.currentStreak ?? 0}
                            showStreak={hasCheckIns}
                          />
                        </div>

                        <div className="min-w-[100px] text-[13px]">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:hidden">
                            Última atividade
                          </span>
                          <p className={cn("font-semibold tabular-nums", last.colorClass)}>
                            {last.label}
                          </p>
                        </div>

                        {sent ? (
                          <span className="inline-flex min-h-10 min-w-[158px] flex-1 items-center justify-center gap-1.5 text-[13px] font-semibold text-primary sm:flex-none">
                            <Check className="size-4" strokeWidth={2.5} aria-hidden />
                            Lembrete enviado
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 min-w-[158px] flex-1 border-border bg-transparent text-[13px] font-semibold hover:border-primary/40 hover:bg-primary/10 hover:text-primary sm:flex-none"
                            disabled={nudgeLoading}
                            onClick={() => void openReminder(risk)}
                          >
                            <Bell className="size-4" aria-hidden />
                            Enviar lembrete
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </PanelState>
          </div>
        ) : null}
      </section>

      <ReminderModal
        open={reminderTarget != null}
        studentName={reminderTarget?.studentName ?? ""}
        initialText={reminderText}
        loading={nudgeLoading}
        onClose={() => setReminderTarget(null)}
        onSend={confirmReminder}
      />

      <p className="sr-only">
        Métricas exibidas vêm do motor de retenção via API. Sugestões do Radar não substituem
        orientação médica ou profissional.
      </p>
    </div>
  );
}
