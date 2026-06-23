import { useEffect } from "react";
import { CalendarCheck, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckInCelebrationProps = {
  show: boolean;
  streak?: number;
  onComplete?: () => void;
  className?: string;
};

/** Subtle post-check-in celebration — respects prefers-reduced-motion via CSS. */
export function CheckInCelebration({
  show,
  streak,
  onComplete,
  className,
}: CheckInCelebrationProps) {
  useEffect(() => {
    if (!show) return;
    const timer = window.setTimeout(() => onComplete?.(), 2200);
    return () => window.clearTimeout(timer);
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Check-in registrado com sucesso"
    >
      <div className="celebration-pop flex items-center gap-3 rounded-2xl border border-primary/40 bg-card/95 px-5 py-3 shadow-lg backdrop-blur-md">
        <div
          className="flex size-10 items-center justify-center rounded-xl bg-primary/15"
          aria-hidden
        >
          <CalendarCheck className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground">Treino registrado!</p>
          {streak != null && streak > 0 ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Flame className="size-3.5 text-flame" aria-hidden />
              {streak} {streak === 1 ? "dia" : "dias"} de streak
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Continue assim!</p>
          )}
        </div>
      </div>
    </div>
  );
}
