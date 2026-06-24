import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Flame, HeartPulse, Trophy, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CreatorEmptyRings } from "@/components/creator/CreatorEmptyRings";
import { FilterPill } from "@/components/creator/FilterPill";
import { RankingPodium } from "@/components/creator/RankingPodium";
import { StudentAvatar } from "@/components/creator/StudentAvatar";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { retentionApi } from "@/lib/api/retention-api";
import { spaceApi } from "@/lib/api/space-api";
import { buildCreatorSpaceUrl, copyTextToClipboard } from "@/lib/app/public-url";
import type { CreatorRankingEntry, CreatorRankingResult, RankingMetric, RankingPeriod } from "@/lib/api/domain-types";
import { formatRankingValue } from "@/lib/creator/ranking-utils";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const METRIC_OPTIONS: { key: RankingMetric; label: string; icon: typeof HeartPulse }[] = [
  { key: "ADHERENCE", label: "Aderência", icon: HeartPulse },
  { key: "STREAK", label: "Streak", icon: Flame },
];

const PERIOD_OPTIONS: { key: RankingPeriod; label: string }[] = [
  { key: "WEEK", label: "Semana" },
  { key: "MONTH", label: "Mês" },
];

export function RankingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [metric, setMetric] = useState<RankingMetric>("ADHERENCE");
  const [period, setPeriod] = useState<RankingPeriod>("WEEK");
  const [ranking, setRanking] = useState<CreatorRankingResult | null>(null);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [spaceLink, setSpaceLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await retentionApi.ranking(metric, period);
      setRanking(data);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar ranking.");
      setState("error");
    }
  }, [metric, period]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void spaceApi
      .get()
      .then((space) => setSpaceLink(space.slug ? buildCreatorSpaceUrl(space.slug) : null))
      .catch(() => setSpaceLink(null));
  }, []);

  const entries = ranking?.entries ?? [];
  const rest = useMemo(() => entries.slice(3), [entries]);
  const isEmpty = state === "content" && entries.length === 0;
  const isFew = state === "content" && entries.length > 0 && entries.length < 3;

  const copyLink = async () => {
    const url = spaceLink ?? `${window.location.origin}/login`;
    if (await copyTextToClipboard(url)) {
      toast("Link copiado.");
    } else {
      toast("Não foi possível copiar o link.", "error");
    }
  };

  const periodHint =
    metric === "STREAK"
      ? "Streak atual (dias consecutivos com check-in)"
      : period === "WEEK"
        ? "Aderência dos últimos 7 dias"
        : "Aderência dos últimos 30 dias";

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-6 md:gap-[26px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
              <Trophy className="size-[18px] text-primary" aria-hidden />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-[27px]">
              Ranking
            </h1>
          </div>
          <p className="max-w-xl text-sm text-pretty text-muted-foreground md:text-[14.5px]">
            Leaderboard da sua comunidade — quem está mandando bem em aderência e consistência.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Métrica do ranking">
          {METRIC_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <FilterPill
                key={opt.key}
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="size-3.5" aria-hidden />
                    {opt.label}
                  </span>
                }
                active={metric === opt.key}
                onClick={() => setMetric(opt.key)}
              />
            );
          })}
        </div>
        {metric === "ADHERENCE" ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Período do ranking">
            {PERIOD_OPTIONS.map((opt) => (
              <FilterPill
                key={opt.key}
                label={opt.label}
                active={period === opt.key}
                onClick={() => setPeriod(opt.key)}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground">{periodHint}</p>
        )}
      </div>

      {metric === "ADHERENCE" ? (
        <p className="-mt-2 text-[13px] text-muted-foreground">{periodHint}</p>
      ) : null}

      <PanelState state={state === "content" ? "content" : state} message={error} onRetry={load} rows={6}>
        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 rounded-[14px] border border-border bg-card px-6 py-14 text-center shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <CreatorEmptyRings size="lg" />
            <div>
              <p className="text-[19px] font-bold tracking-tight text-foreground">
                Ainda não há ranking
              </p>
              <p className="mx-auto mt-1.5 max-w-[400px] text-sm leading-relaxed text-muted-foreground">
                Convide alunos e aguarde check-ins para montar o leaderboard da sua comunidade.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button
                className="h-11 shadow-[0_4px_16px_hsl(var(--primary)/0.25)]"
                onClick={() => navigate("/app/students")}
              >
                <UserPlus className="size-4" aria-hidden />
                Convidar aluno
              </Button>
              <Button type="button" variant="outline" className="h-11" onClick={() => void copyLink()}>
                <Copy className="size-4" aria-hidden />
                Copiar link
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {isFew ? (
              <p className="border-b border-border bg-secondary/30 px-5 py-2.5 text-center text-xs text-muted-foreground">
                Comunidade pequena — exibindo {entries.length}{" "}
                {entries.length === 1 ? "aluno" : "alunos"} no pódio.
              </p>
            ) : null}

            <RankingPodium entries={entries} metric={metric} />

            {rest.length > 0 ? (
              <div className="border-t border-border">
                <div className="hidden grid-cols-[56px_minmax(140px,2fr)_minmax(100px,1fr)] gap-2 border-b border-border bg-secondary/30 px-5 py-0 md:grid md:h-10 md:items-center">
                  {["#", "Aluno", "Valor"].map((h) => (
                    <span
                      key={h}
                      className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <ol className="divide-y divide-border/80" aria-label="Lista ranqueada">
                  {rest.map((entry) => (
                    <RankingRow key={entry.studentId} entry={entry} metric={metric} />
                  ))}
                </ol>
              </div>
            ) : entries.length > 3 ? null : entries.length <= 3 && entries.length > 0 ? (
              <p className="border-t border-border px-5 py-4 text-center text-sm text-muted-foreground">
                Todos os alunos estão no pódio.
              </p>
            ) : null}

            {ranking?.assumptions?.[0] ? (
              <p className="border-t border-border/60 px-5 py-3 text-[11px] text-muted-foreground">
                {ranking.assumptions[0]}
              </p>
            ) : null}
          </div>
        )}
      </PanelState>

      <p className="sr-only">
        Valores do ranking vêm do motor de retenção via API. Sugestão, não orientação médica ou
        profissional.
      </p>
    </div>
  );
}

function RankingRow({ entry, metric }: { entry: CreatorRankingEntry; metric: RankingMetric }) {
  const formatted = formatRankingValue(metric, entry.value);

  return (
    <li>
      <Link
        to={`/app/students/${entry.studentId}`}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[56px_minmax(140px,2fr)_minmax(100px,1fr)]"
        aria-label={`${entry.rank}º lugar: ${entry.studentName}, ${formatted.ariaLabel}`}
      >
        <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/50 text-sm font-extrabold tabular-nums text-muted-foreground">
          {entry.rank}
        </span>
        <div className="flex min-w-0 items-center gap-3">
          <StudentAvatar name={entry.studentName} />
          <span className="truncate text-[14.5px] font-semibold">{entry.studentName}</span>
        </div>
        <div
          className={cn(
            "flex items-center justify-end gap-1.5 text-right text-[15px] font-extrabold tabular-nums",
            metric === "STREAK" ? "text-flame" : "text-primary",
          )}
        >
          {metric === "STREAK" ? <Flame className="size-4 streak-flame-pulse" aria-hidden /> : null}
          <span>{formatted.display}</span>
          {formatted.unit ? (
            <span className="text-sm font-semibold text-muted-foreground">{formatted.unit}</span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
