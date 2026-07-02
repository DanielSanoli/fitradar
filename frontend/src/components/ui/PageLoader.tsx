import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/ui/skeleton";

export function PageLoader() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1340px] flex-col gap-5 p-4 md:p-6"
      role="status"
      aria-label="Carregando página"
      aria-busy="true"
    >
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_24px_rgba(0,0,0,0.22)]"
          >
            <Skeleton className="mb-4 h-3 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
      <span className="sr-only">Carregando página…</span>
    </div>
  );
}
