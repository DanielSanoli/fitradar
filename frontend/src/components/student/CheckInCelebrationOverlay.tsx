import { CalendarCheck, Check, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import { celebrationMessage } from "@/lib/student/student-copy";

export type CheckInCelebrationOverlayProps = {
  show: boolean;
  streak: number;
  onClose: () => void;
};

export function CheckInCelebrationOverlay({
  show,
  streak,
  onClose,
}: CheckInCelebrationOverlayProps) {
  const { vocabulary: v } = useSpaceVocabulary();
  const containerRef = useModalA11y(show, onClose);

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-0 bg-[radial-gradient(circle_at_50%_38%,hsl(165_40%_14%)_0%,hsl(var(--background))_66%)] px-7"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="relative mb-6 flex size-[100px] items-center justify-center">
        <span
          className="celebration-ring absolute size-[100px] rounded-full border border-primary/50"
          aria-hidden
        />
        <div className="flex size-[100px] items-center justify-center rounded-full bg-primary shadow-[0_0_52px_hsl(var(--primary)/0.52)] celebration-pop">
          <Check className="size-11 text-primary-foreground" strokeWidth={3.5} aria-hidden />
        </div>
      </div>

      <h2 id="celebration-title" className="text-center text-[30px] font-extrabold tracking-tight">
        {v.checkInCelebration}
      </h2>
      <p className="mb-6 mt-1.5 text-center text-sm text-muted-foreground">
        Sequência mantida · bom trabalho
      </p>

      <div className="flex w-full max-w-[260px] flex-col items-center gap-2 rounded-[20px] border border-primary/30 bg-card px-6 py-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Sequência atual
        </span>
        <div className="flex items-center gap-2">
          <Flame className="size-8 text-flame streak-flame-pulse" aria-hidden />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[52px] font-extrabold leading-none text-primary">{streak}</span>
            <span className="text-lg font-semibold text-muted-foreground">dias</span>
          </div>
        </div>
        <span className="text-center text-sm text-muted-foreground">
          {celebrationMessage(streak)}
        </span>
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
  );
}
