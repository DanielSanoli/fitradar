import { cn } from "@/lib/utils";

type SkeletonProps = React.ComponentProps<"div">;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-[10px] border border-border skeleton-shimmer motion-safe:animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}

type SkeletonCardProps = {
  className?: string;
  lines?: number;
};

function SkeletonCard({ className, lines = 2 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_24px_rgba(0,0,0,0.22)]",
        className,
      )}
      aria-hidden
    >
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-[11px]" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-4 w-3/5" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-4/5" : "w-full")} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonInsightGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_24px_rgba(0,0,0,0.22)]"
        >
          <Skeleton className="mb-4 h-3 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      ))}
    </div>
  );
}

function SkeletonPageHeader() {
  return (
    <div className="space-y-2.5" aria-hidden>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonInsightGrid, SkeletonPageHeader };
