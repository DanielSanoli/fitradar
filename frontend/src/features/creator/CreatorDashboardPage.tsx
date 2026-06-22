import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InsightCard } from "@/components/radar/InsightCard";
import { RadarChat, type RadarMessage } from "@/components/radar/RadarChat";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { PanelState } from "@/components/ui/PanelState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copilotApi } from "@/lib/api/copilot-api";
import {
  formatAdherence,
  riskLevelToUi,
  type ChurnRiskResult,
  type CreatorOverviewResult,
} from "@/lib/api/domain-types";
import { retentionApi } from "@/lib/api/retention-api";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type AttentionState = "empty" | "positive" | "alerts";

function deriveAttentionState(overview: CreatorOverviewResult | null): AttentionState {
  if (!overview || overview.activeStudents === 0) return "empty";
  if (overview.atRiskCount === 0) return "positive";
  return "alerts";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function CreatorDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [overview, setOverview] = useState<CreatorOverviewResult | null>(null);
  const [atRisk, setAtRisk] = useState<ChurnRiskResult[]>([]);
  const [overviewState, setOverviewState] = useState<"loading" | "error" | "content">("loading");
  const [riskState, setRiskState] = useState<"loading" | "error" | "content">("loading");
  const [overviewError, setOverviewError] = useState<string>();
  const [riskError, setRiskError] = useState<string>();
  const [chatMessages, setChatMessages] = useState<RadarMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const greeting = user?.name
    ? `Oi, ${user.name.split(" ")[0]}! Pergunte sobre os alunos em risco ou a visão geral da sua comunidade.`
    : undefined;

  const loadOverview = useCallback(async () => {
    setOverviewState("loading");
    try {
      const data = await retentionApi.overview();
      setOverview(data);
      setOverviewState("content");
    } catch (e) {
      setOverviewError(e instanceof ApiError ? e.message : "Erro ao carregar visão geral.");
      setOverviewState("error");
    }
  }, []);

  const loadAtRisk = useCallback(async () => {
    setRiskState("loading");
    try {
      const data = await retentionApi.studentsAtRisk("MEDIUM");
      setAtRisk(data);
      setRiskState("content");
    } catch (e) {
      setRiskError(e instanceof ApiError ? e.message : "Erro ao carregar alunos em risco.");
      setRiskState("error");
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadAtRisk();
  }, [loadOverview, loadAtRisk]);

  useEffect(() => {
    if (greeting) {
      setChatMessages([{ id: "greeting", role: "radar", text: greeting }]);
    }
  }, [greeting]);

  const attention = deriveAttentionState(overview);

  const handleAsk = async (question: string) => {
    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: question }]);
    setChatLoading(true);
    try {
      const res = await copilotApi.ask({ question });
      setChatMessages((prev) => [
        ...prev,
        {
          id: `r-${Date.now()}`,
          role: "radar",
          text: res.answer,
          showDisclaimer: true,
        },
      ]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Não consegui responder agora.";
      setChatMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "radar",
          text: `Não consegui responder agora. Tente de novo em instantes.\n\n${msg}`,
          showDisclaimer: true,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const adhDisplay = formatAdherence(overview?.avgAdherence);

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-[27px]">Painel do criador</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Panorama da saúde da sua comunidade e o que fazer hoje.
        </p>
      </div>

      <section>
        <div className="mb-3.5 flex items-center gap-2.5">
          <span
            className="size-2.5 rotate-45 rounded-sm bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
            aria-hidden
          />
          <span className="text-sm font-bold text-foreground">Insights do Radar</span>
          <span className="text-xs text-muted-foreground">leitura inteligente dos seus sinais</span>
        </div>

        <PanelState
          state={overviewState === "content" ? "content" : overviewState}
          message={overviewError}
          onRetry={loadOverview}
          rows={4}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <InsightCard
              label="Alunos ativos"
              value={overview?.activeStudents ?? "—"}
              glowColor="hsl(var(--glow-accent))"
            />
            <InsightCard
              label="Aderência média"
              value={adhDisplay.replace("%", "")}
              unit={adhDisplay !== "—" ? "%" : ""}
              glowColor="hsl(var(--glow-accent))"
            />
            <InsightCard
              label="Em risco"
              value={overview?.atRiskCount ?? "—"}
              riskLevel={overview && overview.atRiskCount > 0 ? "alto" : undefined}
              glowColor={
                overview && overview.atRiskCount > 0
                  ? "hsl(var(--glow-danger))"
                  : "hsl(var(--glow-accent))"
              }
            />
            <InsightCard
              label="Check-ins na semana"
              value={overview?.checkInsThisWeek ?? "—"}
              glowColor="hsl(var(--glow-accent))"
            />
            <InsightCard
              label="Novos na semana"
              value={overview?.newStudentsThisWeek ?? "—"}
              glowColor="hsl(var(--glow-accent))"
            />
          </div>
        </PanelState>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <Card className="flex flex-col overflow-hidden border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2.5 text-base">
                  Atenção hoje
                  {attention === "alerts" && overview ? (
                    <span className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full border border-[hsl(var(--risk-high)/0.34)] bg-[hsl(var(--risk-high)/0.16)] px-1.5 text-xs font-bold text-[hsl(0_82%_80%)]">
                      {overview.atRiskCount}
                    </span>
                  ) : null}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {attention === "empty" &&
                    "Convide seu primeiro aluno para começar a monitorar a comunidade."}
                  {attention === "positive" && "Comunidade saudável — nenhum aluno em risco médio ou alto."}
                  {attention === "alerts" && "Alunos que precisam de atenção imediata."}
                </p>
              </div>
              {attention === "alerts" ? (
                <Link
                  to="/app/students"
                  className="shrink-0 text-sm font-semibold text-primary hover:underline"
                >
                  Ver todos →
                </Link>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center px-3 py-2">
            {attention === "empty" ? (
              <PanelState
                state="empty"
                icon="👥"
                title="Nenhum aluno ainda"
                message="Convide seu primeiro aluno para acompanhar aderência e risco de churn."
                actionLabel="Gerenciar alunos"
                onAction={() => navigate("/app/students")}
              />
            ) : null}

            {attention === "positive" ? (
              <PanelState
                state="empty"
                icon="🎉"
                title="Comunidade saudável"
                message="Nenhum aluno em risco médio ou alto no momento."
              />
            ) : null}

            {attention === "alerts" ? (
              <PanelState
                state={riskState === "content" ? "content" : riskState}
                message={riskError}
                onRetry={loadAtRisk}
                rows={3}
              >
                <ul className="flex flex-col gap-0.5">
                  {atRisk.slice(0, 5).map((s) => (
                    <li
                      key={s.studentId}
                      className={cn(
                        "flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-secondary/80",
                      )}
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-sm font-bold">
                        {initials(s.studentName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{s.studentName}</span>
                          <RiskBadge level={riskLevelToUi(s.level)} />
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {(s.assumptions ?? []).join(" · ")}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0" asChild>
                        <Link to={`/app/students/${s.studentId}`}>Ver</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </PanelState>
            ) : null}
          </CardContent>
        </Card>

        <RadarChat
          greeting={greeting}
          messages={chatMessages}
          onAsk={handleAsk}
          loading={chatLoading}
          className="min-h-[min(480px,70vh)]"
        />
      </section>
    </div>
  );
}
