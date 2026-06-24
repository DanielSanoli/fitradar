import { Flame, Medal } from "lucide-react";
import { Link } from "react-router-dom";
import { StudentAvatar } from "@/components/creator/StudentAvatar";
import type { CreatorRankingEntry, RankingMetric } from "@/lib/api/domain-types";
import {
  MEDAL_STYLES,
  formatRankingValue,
  podiumHeight,
} from "@/lib/creator/ranking-utils";
import { cn } from "@/lib/utils";

type RankingPodiumProps = {
  entries: CreatorRankingEntry[];
  metric: RankingMetric;
};

function PodiumSlot({
  entry,
  metric,
  elevated,
}: {
  entry: CreatorRankingEntry;
  metric: RankingMetric;
  elevated?: boolean;
}) {
  const medal = MEDAL_STYLES[entry.rank as 1 | 2 | 3];
  const formatted = formatRankingValue(metric, entry.value);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-end gap-3",
        elevated ? "order-2 sm:-mt-4" : entry.rank === 2 ? "order-1" : "order-3",
      )}
    >
      <Link
        to={`/app/students/${entry.studentId}`}
        className="group flex flex-col items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${entry.rank}º lugar: ${entry.studentName}, ${formatted.ariaLabel}`}
      >
        <div className="relative">
          <StudentAvatar
            name={entry.studentName}
            size="md"
            className={cn("border-2 transition-transform group-hover:scale-[1.03]", medal.ring, medal.bg, medal.glow)}
          />
          <span
            className={cn(
              "absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              medal.ring,
              medal.bg,
              medal.text,
            )}
          >
            <Medal className="size-3" aria-hidden />
            {entry.rank}º
          </span>
        </div>
        <div className="max-w-[120px] text-center">
          <p className="truncate text-sm font-bold text-foreground">{entry.studentName}</p>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-lg font-extrabold tabular-nums text-primary">
            {metric === "STREAK" ? (
              <Flame className="size-4 text-flame streak-flame-pulse" aria-hidden />
            ) : null}
            <span>{formatted.display}</span>
            {formatted.unit ? (
              <span className="text-sm font-semibold text-muted-foreground">{formatted.unit}</span>
            ) : null}
          </p>
        </div>
      </Link>
      <div
        className={cn(
          "flex w-full max-w-[108px] items-end justify-center rounded-t-xl border border-border bg-gradient-to-t from-secondary/80 to-secondary/30",
          podiumHeight(entry.rank),
        )}
        aria-hidden
      >
        <span className={cn("pb-2 text-xs font-bold uppercase tracking-wider", medal.text)}>
          {medal.label}
        </span>
      </div>
    </div>
  );
}

export function RankingPodium({ entries, metric }: RankingPodiumProps) {
  if (entries.length === 0) return null;

  const top3 = entries.slice(0, 3);
  const displayOrder =
    top3.length === 1
      ? top3
      : top3.length === 2
        ? [top3[1], top3[0]]
        : [top3[1], top3[0], top3[2]];

  return (
    <div
      className="flex items-end justify-center gap-3 px-2 pb-2 pt-6 sm:gap-5"
      role="list"
      aria-label="Pódio do ranking"
    >
      {displayOrder.map((entry) => (
        <div key={entry.studentId} role="listitem" className="flex min-w-0 flex-1 justify-center">
          <PodiumSlot entry={entry} metric={metric} elevated={entry.rank === 1} />
        </div>
      ))}
    </div>
  );
}
