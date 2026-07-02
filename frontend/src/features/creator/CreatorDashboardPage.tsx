import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck,
  HeartPulse,
  Users,
} from "lucide-react";
import { InsightCard } from "@/components/radar/InsightCard";
import { RadarChat } from "@/components/radar/RadarChat";
import { AttentionTodayPanel } from "@/components/creator/AttentionTodayPanel";
import { CreatorOnboardingChecklist } from "@/components/creator/CreatorOnboardingChecklist";
import { PanelState } from "@/components/ui/PanelState";
import { useAuth } from "@/hooks/useAuth";
import { useRadarCopilot } from "@/features/radar/RadarCopilotProvider";
import {
  formatAdherence,
  riskLevelToUi,
  type ChurnRiskResult,
  type CreatorOverviewResult,
} from "@/lib/api/domain-types";
import { retentionApi } from "@/lib/api/retention-api";
import { spaceApi } from "@/lib/api/space-api";
import { buildCreatorSpaceUrl } from "@/lib/app/public-url";
import {
  dashboardGreeting,
  dashboardSuggestions,
  formatDashboardDate,
  type DashboardAttentionState,
} from "@/lib/creator/dashboard-copy";
import { ApiError } from "@/lib/api/types";

function deriveAttentionState(overview: CreatorOverviewResult | null): DashboardAttentionState {
  if (!overview || overview.activeStudents === 0) return "empty";
  if (overview.atRiskCount === 0) return "positive";
  return "alerts";
}

function firstName(full: string): string {
  return full.split(/\s+/)[0] ?? full;
}

export function CreatorDashboardPage() {
  const { user } = useAuth();
  const { openWidget, setHighlight, ask, messages, loading, title, subtitle } = useRadarCopilot();

  const [overview, setOverview] = useState<CreatorOverviewResult | null>(null);
  const [atRisk, setAtRisk] = useState<ChurnRiskResult[]>([]);
  const [spaceLink, setSpaceLink] = useState<string | null>(null);
  const [overviewState, setOverviewState] = useState<"loading" | "error" | "content">("loading");
  const [riskState, setRiskState] = useState<"loading" | "error" | "content">("loading");
  const [overviewError, setOverviewError] = useState<string>();
  const [riskError, setRiskError] = useState<string>();

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

  const loadSpace = useCallback(async () => {
    try {
      const space = await spaceApi.get();
      if (space.slug) {
        setSpaceLink(buildCreatorSpaceUrl(space.slug));
      }
    } catch {
      setSpaceLink(null);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadAtRisk();
    void loadSpace();
  }, [loadOverview, loadAtRisk, loadSpace]);

  const attention = deriveAttentionState(overview);

  useEffect(() => {
    setHighlight(attention === "alerts");
  }, [attention, setHighlight]);

  const name = user?.name ?? "Criador";
  const chatGreeting = dashboardGreeting(firstName(name), attention);
  const chatSuggestions = useMemo(() => dashboardSuggestions(attention), [attention]);

  const adhDisplay = formatAdherence(overview?.avgAdherence);
  const adhValue = adhDisplay === "—" ? "—" : adhDisplay.replace("%", "");

  const atRiskGlow =
    overview && overview.atRiskCount > 0
      ? "hsl(var(--glow-danger))"
      : overview && overview.activeStudents > 0
        ? "hsl(var(--glow-accent))"
        : "hsl(215 20% 40%)";

  const celebrate = () => {
    void ask("Quem merece um parabéns?");
    openWidget();
  };

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-6 md:gap-[26px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground md:text-[27px]">
            Painel do criador
          </h1>
          <p className="mt-1.5 text-sm text-pretty text-muted-foreground md:text-[14.5px]">
            {formatDashboardDate()} — um panorama da saúde da sua comunidade e o que fazer hoje.
          </p>
        </div>
      </div>

      <CreatorOnboardingChecklist />

      <section aria-labelledby="insights-heading">
        <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
          <span
            className="size-2.5 rotate-45 rounded-sm bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
            aria-hidden
          />
          <h2 id="insights-heading" className="text-sm font-bold text-foreground">
            Insights do Radar
          </h2>
          <span className="text-xs text-muted-foreground">leitura inteligente dos seus sinais</span>
          {overviewState === "content" ? (
            <div className="ml-auto flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <span className="relative flex size-[7px]" aria-hidden>
                <span className="absolute inset-0 animate-pulse rounded-full bg-primary" />
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-40" />
              </span>
              Atualizado agora
            </div>
          ) : null}
        </div>

        <PanelState
          state={overviewState === "content" ? "content" : overviewState}
          message={overviewError}
          onRetry={loadOverview}
          rows={4}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InsightCard
              label="Alunos ativos"
              value={overview?.activeStudents ?? "—"}
              icon={Users}
              glowColor="hsl(var(--glow-accent))"
              entryDelay={0}
            />
            <InsightCard
              label="Aderência média"
              value={adhValue}
              unit={adhDisplay !== "—" ? "%" : ""}
              icon={HeartPulse}
              glowColor="hsl(var(--glow-accent))"
              entryDelay={60}
            />
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
              entryDelay={120}
            />
            <InsightCard
              label="Check-ins na semana"
              value={overview?.checkInsThisWeek ?? "—"}
              icon={CalendarCheck}
              glowColor="hsl(var(--glow-accent))"
              entryDelay={180}
            />
          </div>
        </PanelState>
      </section>

      <section
        className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 lg:gap-[18px]"
        aria-label="Atenção e copiloto"
      >
        <AttentionTodayPanel
          state={attention}
          atRisk={atRisk}
          riskCount={overview?.atRiskCount ?? 0}
          spaceLink={spaceLink}
          loadState={riskState}
          errorMessage={riskError}
          onRetry={loadAtRisk}
          onCelebrate={celebrate}
        />

        <div className="min-h-[480px] lg:min-h-[520px]">
          <RadarChat
            embedded
            className="h-full min-h-[480px] lg:min-h-[520px]"
            title={title}
            subtitle={subtitle}
            greeting={chatGreeting}
            suggestions={chatSuggestions}
            messages={
              messages.length > 0 && messages[0]?.id === "greeting"
                ? [{ ...messages[0], text: chatGreeting }, ...messages.slice(1)]
                : messages
            }
            onAsk={ask}
            loading={loading}
          />
        </div>
      </section>

      <p className="sr-only">
        Métricas exibidas vêm do motor de retenção via API. Sugestões do Radar não substituem
        orientação médica ou profissional.
      </p>
    </div>
  );
}
