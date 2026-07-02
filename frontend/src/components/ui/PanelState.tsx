import { AlertCircle } from "lucide-react";
import { FitnessEmptyIcon } from "@/components/fitness/FitnessEmptyIcon";
import {
  Skeleton,
  SkeletonCard,
  SkeletonInsightGrid,
  SkeletonPageHeader,
} from "@/components/ui/skeleton";
import type { FitnessIconContext } from "@/lib/icons/fitness-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PanelSkeletonVariant = "rows" | "cards" | "dashboard" | "student-home";

export type PanelStateProps = {
  state: "loading" | "error" | "empty" | "content";
  message?: string;
  title?: string;
  icon?: React.ReactNode;
  iconContext?: FitnessIconContext;
  emptyVariant?: "creator" | "student";
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  rows?: number;
  skeletonVariant?: PanelSkeletonVariant;
  className?: string;
  children?: React.ReactNode;
};

function PanelLoadingSkeleton({
  variant,
  rows,
  className,
}: {
  variant: PanelSkeletonVariant;
  rows: number;
  className?: string;
}) {
  if (variant === "dashboard") {
    return (
      <div className={cn("flex flex-col gap-4 py-2", className)} aria-busy="true">
        <SkeletonInsightGrid />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-[280px] rounded-[14px]" />
          <Skeleton className="h-[280px] rounded-[14px]" />
        </div>
        <span className="sr-only">Carregando painel…</span>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div
        className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
        aria-busy="true"
      >
        {Array.from({ length: Math.max(3, rows) }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  if (variant === "student-home") {
    return (
      <div className={cn("flex flex-col gap-4 py-2", className)} aria-busy="true">
        <Skeleton className="h-[72px] rounded-[14px]" />
        <Skeleton className="h-[220px] rounded-2xl" />
        <Skeleton className="h-14 rounded-[14px]" />
        <span className="sr-only">Carregando início…</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 py-4", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function PanelState({
  state,
  message,
  title,
  icon,
  iconContext,
  emptyVariant = "creator",
  onRetry,
  actionLabel,
  onAction,
  rows = 3,
  skeletonVariant = "rows",
  className,
  children,
}: PanelStateProps) {
  if (state === "content") {
    if (!className && !children) return null;
    if (!className) return <>{children}</>;
    return <div className={className}>{children}</div>;
  }

  if (state === "loading") {
    return (
      <PanelLoadingSkeleton variant={skeletonVariant} rows={rows} className={className} />
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
        "flex flex-col items-center justify-center gap-4 rounded-[14px] border border-dashed border-border bg-secondary/15 px-6 py-12 text-center",
        className,
      )}
    >
      <div aria-hidden className="motion-safe:animate-fade-in-up">
        {icon ??
          (iconContext ? (
            <FitnessEmptyIcon context={iconContext} variant={emptyVariant} />
          ) : (
            <FitnessEmptyIcon context="activity" variant={emptyVariant} />
          ))}
      </div>
      <div>
        <p className="font-display text-lg font-bold text-foreground">{title ?? "Nada por aqui"}</p>
        {message ? (
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <Button size="default" onClick={onAction} className="min-w-[10rem]">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { SkeletonPageHeader };
