import { useEffect } from "react";
import { CalendarCheck, Check, Flame } from "lucide-react";
import { CheckInConfettiCanvas } from "@/components/student/CheckInConfettiCanvas";
import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/useModalA11y";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { triggerCheckInHaptic } from "@/lib/student/check-in-celebration";
import { cn } from "@/lib/utils";

const RING_C = 2 * Math.PI * 54;

export type CheckInCelebrationOverlayProps = {
  show: boolean;
  streak: number;
  headline: string;
  subtitle: string;
  onClose: () => void;
};

export function CheckInCelebrationOverlay({
  show,
  streak,
  headline,
  subtitle,
  onClose,
}: CheckInCelebrationOverlayProps) {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useModalA11y(show, onClose);

  useEffect(() => {
    if (show && !reducedMotion) {
      triggerCheckInHaptic();
    }
  }, [show, reducedMotion]);

  if (!show) return null;

  return (
    <>
      {!reducedMotion ? <CheckInConfettiCanvas active={show} /> : null}
      <div
        ref={containerRef}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-0 bg-[radial-gradient(circle_at_50%_38%,hsl(165_40%_14%)_0%,hsl(var(--background))_66%)] px-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        aria-describedby="celebration-subtitle"
      >
        <div className="relative mb-6 flex size-[120px] items-center justify-center">
          <svg
            className="absolute inset-0 size-[120px]"
            viewBox="0 0 120 120"
            aria-hidden
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="hsl(var(--primary) / 0.2)"
              strokeWidth="4"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={reducedMotion ? 0 : RING_C}
              transform="rotate(-90 60 60)"
              className={cn(!reducedMotion && "celebration-ring-close")}
            />
          </svg>
          {!reducedMotion ? (
            <span
              className="celebration-ring pointer-events-none absolute size-[100px] rounded-full border border-primary/50"
              aria-hidden
            />
          ) : null}
          <div
            className={cn(
              "relative flex size-[100px] items-center justify-center rounded-full bg-primary shadow-[0_0_52px_hsl(var(--primary)/0.52)]",
              !reducedMotion && "celebration-pop",
            )}
          >
            <Check className="size-11 text-primary-foreground" strokeWidth={3.5} aria-hidden />
          </div>
        </div>

        <h2 id="celebration-title" className="text-center text-[30px] font-extrabold tracking-tight">
          {headline}
        </h2>
        <p id="celebration-subtitle" className="mb-6 mt-1.5 text-center text-sm text-muted-foreground">
          {subtitle}
        </p>

        <div className="flex w-full max-w-[260px] flex-col items-center gap-2 rounded-[20px] border border-primary/30 bg-card px-6 py-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Sequência atual
          </span>
          <div className="flex items-center gap-2">
            <Flame className="size-8 text-flame streak-flame-pulse" aria-hidden />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[52px] font-extrabold leading-none text-primary tabular-nums">
                {streak}
              </span>
              <span className="text-lg font-semibold text-muted-foreground">dias</span>
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="mt-6 h-14 w-full max-w-[320px] gap-2 rounded-2xl text-lg font-bold shadow-[0_6px_22px_hsl(var(--primary)/0.34)]"
          onClick={onClose}
        >
          <CalendarCheck className="size-5" aria-hidden />
          Fechar
        </Button>
      </div>
    </>
  );
}
