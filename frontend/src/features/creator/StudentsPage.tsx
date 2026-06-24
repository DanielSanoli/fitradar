import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Search, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { CreatorEmptyRings } from "@/components/creator/CreatorEmptyRings";
import { FilterPill } from "@/components/creator/FilterPill";
import { InviteStudentModal } from "@/components/creator/InviteStudentModal";
import { StudentAvatar } from "@/components/creator/StudentAvatar";
import { StudentListMetrics } from "@/components/creator/StudentListMetrics";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { gamificationApi } from "@/lib/api/gamification-api";
import { retentionApi } from "@/lib/api/retention-api";
import { spaceApi } from "@/lib/api/space-api";
import { studentsApi } from "@/lib/api/students-api";
import { buildCreatorSpaceUrl, formatCreatorSpaceLinkDisplay } from "@/lib/app/public-url";
import type {
  ChurnRiskResult,
  EnrollmentResponse,
  StudentProgressResult,
  StudentResponse,
} from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import {
  formatJoinedStr,
  formatLastActivity,
  isHighRisk,
  parseInactiveDays,
  riskUi,
} from "@/lib/creator/display-utils";
import { cn } from "@/lib/utils";

type StudentFilter = "all" | "risk" | "high" | "noCheckins";

type StudentRow = {
  student: StudentResponse;
  progress: StudentProgressResult | null;
  risk: ChurnRiskResult | null;
  program: string;
  totalCheckIns: number;
  progressUnavailable: boolean;
  riskUnavailable: boolean;
  enrollUnavailable: boolean;
};

async function enrichStudent(
  student: StudentResponse,
  riskMap: Map<string, ChurnRiskResult>,
  checkInsMap: Map<string, number>,
): Promise<StudentRow> {
  const [progressResult, enrollResult, riskResult] = await Promise.allSettled([
    retentionApi.studentProgress(student.id),
    studentsApi.enrollments(student.id),
    riskMap.has(student.id)
      ? Promise.resolve(riskMap.get(student.id)!)
      : retentionApi.studentRisk(student.id),
  ]);

  const progress = progressResult.status === "fulfilled" ? progressResult.value : null;
  const enrollments =
    enrollResult.status === "fulfilled" ? enrollResult.value : ([] as EnrollmentResponse[]);
  const risk =
    riskResult.status === "fulfilled"
      ? riskResult.value
      : riskMap.get(student.id) ?? null;

  const activeProgram = enrollments.find((e) => e.active)?.programTitle ?? "—";

  return {
    student,
    progress,
    risk,
    program: activeProgram,
    totalCheckIns: checkInsMap.get(student.id) ?? 0,
    progressUnavailable: progressResult.status === "rejected",
    riskUnavailable: riskResult.status === "rejected" && !riskMap.has(student.id),
    enrollUnavailable: enrollResult.status === "rejected",
  };
}

export function StudentsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [partialWarning, setPartialWarning] = useState<string>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StudentFilter>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    name: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [spaceLink, setSpaceLink] = useState<string | null>(null);
  const [copiedSpace, setCopiedSpace] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    setPartialWarning(undefined);

    try {
      const page = await studentsApi.list();

      let atRisk: ChurnRiskResult[] = [];
      let atRiskFailed = false;
      try {
        atRisk = await retentionApi.studentsAtRisk("LOW");
      } catch {
        atRiskFailed = true;
      }

      const [leaderboardResult, space] = await Promise.all([
        gamificationApi.leaderboard().catch(() => []),
        spaceApi.get().catch(() => null),
      ]);

      const riskMap = new Map(atRisk.map((r) => [r.studentId, r]));
      const checkInsMap = new Map(leaderboardResult.map((e) => [e.studentId, e.totalCheckInsDone]));

      setSpaceLink(space?.slug ? buildCreatorSpaceUrl(space.slug) : null);

      const enriched = await Promise.all(
        page.content.map((s) => enrichStudent(s, riskMap, checkInsMap)),
      );

      const partialCount = enriched.filter(
        (r) => r.progressUnavailable || r.riskUnavailable || r.enrollUnavailable,
      ).length;

      const warnings: string[] = [];
      if (atRiskFailed) {
        warnings.push("Dados agregados de risco do Radar indisponíveis.");
      }
      if (partialCount > 0) {
        warnings.push(
          `Indicadores incompletos para ${partialCount} aluno${partialCount === 1 ? "" : "s"}.`,
        );
      }
      if (warnings.length) setPartialWarning(warnings.join(" "));

      setRows(enriched);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar alunos.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const riskCount = useMemo(
    () => rows.filter((r) => r.risk && isHighRisk(r.risk.level)).length,
    [rows],
  );

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "risk") {
      list = list.filter((r) => r.risk && isHighRisk(r.risk.level));
    }
    if (filter === "high") {
      list = list.filter((r) => {
        const adh = parseFloat(r.progress?.adherence ?? "");
        return Number.isFinite(adh) && adh >= 80;
      });
    }
    if (filter === "noCheckins") {
      list = list.filter((r) => r.totalCheckIns === 0);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.student.name.toLowerCase().includes(q) ||
          r.program.toLowerCase().includes(q) ||
          r.student.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, filter, search]);

  const invite = async (name: string, email: string) => {
    setInviting(true);
    try {
      const r = await studentsApi.invite({ name, email });
      setInviteResult({
        name: r.name,
        email: r.email,
        temporaryPassword: r.temporaryPassword,
      });
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Erro ao convidar.", "error");
    } finally {
      setInviting(false);
    }
  };

  const copySpaceLink = async () => {
    if (!spaceLink) return;
    await navigator.clipboard.writeText(spaceLink);
    setCopiedSpace(true);
    window.setTimeout(() => setCopiedSpace(false), 2200);
  };

  const subtitle =
    rows.length === 0
      ? "Nenhum aluno ainda — convide o primeiro"
      : `${rows.length} alunos · ${riskCount} em risco`;

  const filters: { key: StudentFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "risk", label: "Em risco" },
    { key: "high", label: "Aderência alta" },
    { key: "noCheckins", label: "Sem check-ins" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1340px] flex-col gap-5 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Alunos</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setInviteResult(null);
            setShowInvite(true);
          }}
          className="h-11 gap-2 rounded-[11px] px-5 shadow-[0_4px_18px_hsl(var(--primary)/0.28)]"
        >
          <UserPlus className="size-4" strokeWidth={2.5} aria-hidden />
          Convidar aluno
        </Button>
      </div>

      {partialWarning ? (
        <Alert>
          <AlertDescription>{partialWarning}</AlertDescription>
        </Alert>
      ) : null}

      {state === "content" && rows.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] max-w-[360px] flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar aluno ou programa…"
                aria-label="Buscar aluno ou programa"
                className="h-[42px] w-full rounded-[10px] border border-border bg-secondary/40 py-0 pl-10 pr-3.5 text-sm transition-colors focus:border-primary/60 focus:outline-none focus:ring-[3px] focus:ring-primary/15"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar alunos">
              {filters.map((f) => (
                <FilterPill
                  key={f.key}
                  label={f.label}
                  active={filter === f.key}
                  onClick={() => setFilter(f.key)}
                />
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Search className="size-10 text-muted-foreground" strokeWidth={1.5} aria-hidden />
              <p className="text-[17px] font-bold">Nenhum aluno encontrado</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Tente outro nome ou limpe os filtros.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="hidden grid-cols-[minmax(160px,2.4fr)_minmax(110px,1.5fr)_minmax(140px,1.2fr)_122px_140px_40px] gap-2 border-b border-border bg-secondary/30 px-5 py-0 md:grid md:h-10 md:items-center">
                {["Aluno", "Programa", "Aderência", "Risco", "Última atividade", ""].map((h) => (
                  <span
                    key={h || "chevron"}
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {filtered.map((row) => {
                const inactive = parseInactiveDays(row.risk?.assumptions);
                const hasCheckIns = row.totalCheckIns > 0;
                const isNew = !hasCheckIns;
                const last = formatLastActivity(inactive, hasCheckIns);
                const uiLevel = row.risk ? riskUi(row.risk.level) : null;

                return (
                  <Link
                    key={row.student.id}
                    to={`/app/students/${row.student.id}`}
                    className="grid grid-cols-1 gap-3 border-b border-border/80 px-5 py-4 transition-colors last:border-b-0 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(160px,2.4fr)_minmax(110px,1.5fr)_minmax(140px,1.2fr)_122px_140px_40px] md:items-center md:gap-2"
                    aria-label={`Ver detalhes de ${row.student.name}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StudentAvatar name={row.student.name} />
                      <div className="min-w-0">
                        <p className="truncate text-[14.5px] font-semibold">{row.student.name}</p>
                        {isNew ? (
                          <p className="text-[11.5px] text-muted-foreground">
                            Entrou {formatJoinedStr(row.student.createdAt)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="truncate text-[13.5px] text-foreground/80 md:block">
                      <span className="mr-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:hidden">
                        Programa
                      </span>
                      {row.program}
                    </span>
                    <div>
                      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:hidden">
                        Aderência
                      </span>
                      <StudentListMetrics
                        adherence={row.progress?.adherence}
                        streak={row.progress?.currentStreak ?? 0}
                        showStreak={hasCheckIns}
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:hidden">
                        Risco
                      </span>
                      {isNew ? (
                        <span className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          Novo
                        </span>
                      ) : uiLevel ? (
                        <RiskBadge level={uiLevel} />
                      ) : row.riskUnavailable ? (
                        <span className="text-xs text-muted-foreground">Indisponível</span>
                      ) : null}
                    </div>
                    <span className={cn("text-[13.5px]", last.colorClass)}>
                      <span className="mr-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:hidden">
                        Atividade
                      </span>
                      {last.label}
                    </span>
                    <div className="hidden justify-end md:flex">
                      <ChevronRight className="size-[17px] text-muted-foreground" aria-hidden />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <PanelState
          state={state === "content" && rows.length === 0 ? "empty" : state}
          message={error}
          onRetry={load}
          rows={4}
        >
          {null}
        </PanelState>
      )}

      {state === "content" && rows.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <CreatorEmptyRings />
          <div>
            <p className="text-[22px] font-extrabold tracking-tight">Seu espaço está esperando</p>
            <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Convide seu primeiro aluno e o Radar começa a monitorar treinos, check-ins e sinais de
              risco na hora.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button
              size="lg"
              className="h-[46px] gap-2 rounded-[11px] px-6 shadow-[0_4px_18px_hsl(var(--primary)/0.3)]"
              onClick={() => setShowInvite(true)}
            >
              <UserPlus className="size-4" strokeWidth={2.5} aria-hidden />
              Convidar primeiro aluno
            </Button>
            {spaceLink ? (
              <Button
                variant="outline"
                size="lg"
                className="h-[46px] rounded-[11px]"
                onClick={() => void copySpaceLink()}
              >
                {copiedSpace ? "Copiado!" : "Copiar link"}
              </Button>
            ) : null}
          </div>
          {spaceLink ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-[11px] border border-dashed border-border bg-secondary/30 px-4 py-2.5 font-mono text-[12.5px] text-muted-foreground">
              {spaceLink ? formatCreatorSpaceLinkDisplay(spaceLink) : null}
              <button
                type="button"
                onClick={() => void copySpaceLink()}
                className="font-sans text-[12.5px] font-semibold text-primary hover:underline"
              >
                copiar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <InviteStudentModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={invite}
        inviting={inviting}
        result={inviteResult}
        onClearResult={() => setInviteResult(null)}
        spaceLink={spaceLink}
      />
    </div>
  );
}
