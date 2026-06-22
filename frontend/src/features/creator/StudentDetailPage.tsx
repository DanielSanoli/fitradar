import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RiskBadge } from "@/components/radar/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { copilotApi } from "@/lib/api/copilot-api";
import {
  formatAdherence,
  riskLevelToUi,
  type EnrollmentResponse,
  type StudentProgressResult,
} from "@/lib/api/domain-types";
import { programsApi } from "@/lib/api/programs-api";
import { retentionApi } from "@/lib/api/retention-api";
import { studentsApi } from "@/lib/api/students-api";
import type { ChurnRiskResult, ProgramResponse, StudentResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";

export function StudentDetailPage() {
  const { toast } = useToast();
  const { id = "" } = useParams();
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [risk, setRisk] = useState<ChurnRiskResult | null>(null);
  const [progress, setProgress] = useState<StudentProgressResult | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [programs, setPrograms] = useState<ProgramResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [selectedProgram, setSelectedProgram] = useState("");
  const [nudge, setNudge] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setState("loading");
    try {
      const [s, r, p, e, progs] = await Promise.all([
        studentsApi.get(id),
        retentionApi.studentRisk(id).catch(() => null),
        retentionApi.studentProgress(id).catch(() => null),
        studentsApi.enrollments(id).catch(() => []),
        programsApi.list().catch(() => []),
      ]);
      setStudent(s);
      setRisk(r);
      setProgress(p);
      setEnrollments(e);
      setPrograms(progs);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar aluno.");
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const enroll = async () => {
    if (!selectedProgram) return;
    try {
      await studentsApi.enroll(id, { programId: selectedProgram });
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao matricular.", "error");
    }
  };

  const unenroll = async (enrollmentId: string) => {
    try {
      await studentsApi.unenroll(id, enrollmentId);
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao encerrar matrícula.", "error");
    }
  };

  const generateNudge = async () => {
    try {
      const n = await copilotApi.nudge(id);
      setNudge(n.message);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Erro ao gerar nudge.", "error");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/students">← Alunos</Link>
        </Button>
      </div>

      <PanelState state={state} message={error} onRetry={load}>
        {student ? (
          <>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{student.name}</h1>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {risk ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Risco de churn</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <RiskBadge level={riskLevelToUi(risk.level)} />
                    <p className="text-sm text-muted-foreground">
                      Score: {risk.score} · {(risk.assumptions ?? []).join(" · ")}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => void generateNudge()}>
                      Gerar nudge
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              {progress ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Progresso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Aderência: {formatAdherence(progress.adherence)}</p>
                    <p>Streak: {progress.currentStreak} dias</p>
                    <p>Treinos na semana: {progress.weeklyDone}</p>
                    {progress.nextWorkoutTitle ? (
                      <p>Próximo: {progress.nextWorkoutTitle}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {nudge ? (
              <Card className="border-primary/30">
                <CardContent className="pt-4">
                  <Label>Nudge sugerido</Label>
                  <textarea
                    readOnly
                    value={nudge}
                    className="mt-2 min-h-[120px] w-full rounded-xl border border-input bg-background p-3 text-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sugestão, não orientação médica/profissional.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Matrículas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem matrículas.</p>
                ) : (
                  <ul className="space-y-2">
                    {enrollments.map((en) => (
                      <li
                        key={en.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{en.programTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {en.active ? "ativa" : "inativa"} · desde {en.startDate ?? "—"}
                          </p>
                        </div>
                        {en.active ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void unenroll(en.id)}
                          >
                            Encerrar
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                    aria-label="Programa para matricular"
                  >
                    <option value="">Selecione um programa</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => void enroll()} disabled={!selectedProgram}>
                    Matricular
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </PanelState>
    </div>
  );
}
