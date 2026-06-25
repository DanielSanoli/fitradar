import { Flame, Trophy } from "lucide-react";
import { PanelState } from "@/components/ui/PanelState";
import type { GamificationProfileResponse, LeaderboardEntryResponse } from "@/lib/api/domain-types";
import { cn } from "@/lib/utils";

type StudentCommunityRankingProps = {
  gamification: GamificationProfileResponse | null;
  leaderboard: LeaderboardEntryResponse[];
  state: "loading" | "error" | "content";
  error?: string;
  onRetry?: () => void;
  currentStudentId?: string;
};

export function StudentCommunityRanking({
  gamification,
  leaderboard,
  state,
  error,
  onRetry,
  currentStudentId,
}: StudentCommunityRankingProps) {
  const rank = gamification?.rank ?? 0;
  const showRank = rank > 0;

  return (
    <section
      className="rounded-[18px] border border-border bg-card p-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.28)]"
      aria-labelledby="student-ranking-heading"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="student-ranking-heading" className="flex items-center gap-2 text-sm font-bold">
            <Trophy className="size-4 text-primary" aria-hidden />
            Ranking da comunidade
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Posição por sequência e check-ins — dados do backend.
          </p>
        </div>
        {showRank ? (
          <div className="shrink-0 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary/80">Sua posição</p>
            <p className="text-2xl font-extrabold leading-none text-primary tabular-nums">#{rank}</p>
          </div>
        ) : null}
      </div>

      <PanelState state={state} message={error} onRetry={onRetry} rows={2}>
        {leaderboard.length === 0 ? (
          <p className="rounded-[11px] border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            Ainda não há ranking — faça check-ins para aparecer na comunidade.
          </p>
        ) : (
          <ol className="space-y-2">
            {leaderboard.map((entry) => {
              const isMe = currentStudentId != null && entry.studentId === currentStudentId;
              return (
                <li
                  key={entry.studentId}
                  className={cn(
                    "flex items-center gap-3 rounded-[13px] border px-3.5 py-3",
                    isMe
                      ? "border-primary/35 bg-primary/10"
                      : "border-border bg-muted/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-[9px] text-sm font-extrabold tabular-nums",
                      entry.rank <= 3
                        ? "border border-primary/30 bg-primary/15 text-primary"
                        : "border border-border bg-secondary text-muted-foreground",
                    )}
                    aria-label={`Posição ${entry.rank}`}
                  >
                    {entry.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {entry.studentName}
                      {isMe ? (
                        <span className="ml-1.5 text-xs font-bold text-primary">(você)</span>
                      ) : null}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="size-3 text-flame" aria-hidden />
                        {entry.currentStreak} dias
                      </span>
                      <span aria-hidden>·</span>
                      <span>{entry.totalCheckInsDone} check-ins</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </PanelState>
    </section>
  );
}
