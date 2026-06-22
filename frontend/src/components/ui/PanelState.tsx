import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PanelStateProps = {
  state: "loading" | "error" | "empty" | "content";
  message?: string;
  title?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  rows?: number;
  className?: string;
  children?: React.ReactNode;
};

export function PanelState({
  state,
  message,
  title,
  icon,
  onRetry,
  actionLabel,
  onAction,
  rows = 3,
  className,
  children,
}: PanelStateProps) {
  if (state === "content") {
    return <>{children}</>;
  }

  if (state === "loading") {
    return (
      <div className={cn("flex flex-col gap-3 py-4", className)} aria-busy="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl border border-border bg-muted/40"
          />
        ))}
        <span className="sr-only">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Carregando…
        </span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <Alert variant="destructive" className={cn("my-2", className)}>
        <AlertCircle className="size-4" />
        <AlertTitle>{title ?? "Erro ao carregar"}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{message ?? "Tente novamente em instantes."}</span>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry} className="w-fit">
              Tentar de novo
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-10 text-center",
        className,
      )}
    >
      <div className="text-3xl" aria-hidden>
        {icon ?? <Inbox className="mx-auto size-10 text-muted-foreground" />}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title ?? "Nada por aqui"}</p>
        {message ? <p className="mt-1 text-sm text-muted-foreground">{message}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
