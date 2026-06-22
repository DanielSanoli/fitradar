import { useCallback, useEffect, useMemo, useState } from "react";
import { PushSettingsCard } from "@/components/pwa/PushPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { PanelState } from "@/components/ui/PanelState";
import { memberApi } from "@/lib/api/member-api";
import { formatAdherence } from "@/lib/api/domain-types";
import type { CheckInResponse, GamificationProfileResponse, StudentProgressResult } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";

function AdherenceRing({ value }: { value: string | null }) {
  const pct = value != null && value !== "" ? Math.min(100, Math.max(0, parseFloat(value))) : 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative mx-auto size-36">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold">{formatAdherence(value)}</span>
        <span className="text-xs text-muted-foreground">30 dias</span>
      </div>
    </div>
  );
}

function weeklyBars(checkIns: CheckInResponse[]) {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const now = new Date();
  const counts = Array(7).fill(0) as number[];
  for (const c of checkIns) {
    if (c.status !== "DONE") continue;
    const d = new Date(c.date + "T12:00:00");
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) {
      const idx = (now.getDay() - diff + 7) % 7;
      counts[idx]++;
    }
  }
  const max = Math.max(...counts, 1);
  return days.map((label, i) => ({ label, count: counts[i], height: (counts[i] / max) * 100 }));
}

export function StudentProgressPage() {
  const [progress, setProgress] = useState<StudentProgressResult | null>(null);
  const [gamification, setGamification] = useState<GamificationProfileResponse | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInResponse[]>([]);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [p, g, ci] = await Promise.all([
        memberApi.myProgress(),
        memberApi.myGamification(),
        memberApi.myCheckIns().then((r) => r.content),
      ]);
      setProgress(p);
      setGamification(g);
      setCheckIns(ci);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar progresso.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const bars = useMemo(() => weeklyBars(checkIns), [checkIns]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Meu progresso</h1>
        <p className="text-sm text-muted-foreground">Aderência, streak e atividade semanal.</p>
      </div>

      <PanelState state={state} message={error} onRetry={load}>
        {progress && gamification ? (
          <>
            <Card>
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <AdherenceRing value={progress.adherence} />
                <div className="grid w-full grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-xl font-bold">{progress.currentStreak}</p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{gamification.longestStreak}</p>
                    <p className="text-xs text-muted-foreground">Recorde</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{progress.weeklyDone}</p>
                    <p className="text-xs text-muted-foreground">Na semana</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <h2 className="mb-3 font-semibold">Atividade semanal</h2>
                <div className="flex items-end justify-between gap-2" style={{ height: 100 }}>
                  {bars.map((b) => (
                    <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all"
                        style={{ height: `${Math.max(b.height, 4)}%` }}
                        title={`${b.count} check-in(s)`}
                      />
                      <span className="text-[10px] text-muted-foreground">{b.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <h2 className="font-semibold">Conquistas</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Streak {gamification.currentStreak} · recorde {gamification.longestStreak} · rank #
                  {gamification.rank || "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {gamification.badges.length > 0 ? (
                    gamification.badges.map((b) => (
                      <span
                        key={`${b.type}-${b.earnedAt}`}
                        className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                      >
                        {b.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Faça check-ins para desbloquear badges!
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <PushSettingsCard />

            <p className="text-center text-xs text-muted-foreground">
              Sugestão, não orientação médica/profissional.
            </p>
          </>
        ) : null}
      </PanelState>
    </div>
  );
}
