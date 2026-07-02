export function PageLoader() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6"
      role="status"
      aria-label="Carregando página"
    >
      <div className="relative size-10">
        <div className="absolute inset-0 rounded-full border-2 border-muted skeleton-shimmer motion-safe:animate-shimmer" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Carregando…</p>
    </div>
  );
}
