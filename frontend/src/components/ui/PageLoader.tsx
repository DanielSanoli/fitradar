export function PageLoader() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center p-6"
      role="status"
      aria-label="Carregando página"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
