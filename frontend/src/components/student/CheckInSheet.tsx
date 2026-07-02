import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import { cn } from "@/lib/utils";

const RATING_LABELS = ["Esgotante", "Pesado", "Normal", "Bem", "Ótimo!"] as const;

const RATING_COLORS = [
  "hsl(0 72% 62%)",
  "hsl(22 90% 60%)",
  "hsl(45 78% 58%)",
  "hsl(100 58% 54%)",
  "hsl(var(--primary))",
] as const;

export type CheckInSheetProps = {
  open: boolean;
  workoutTitle: string;
  rating: number | null;
  notes: string;
  consent: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onRatingChange: (rating: number) => void;
  onNotesChange: (notes: string) => void;
  onConsentChange: (consent: boolean) => void;
  onConfirm: () => void;
  onSkip: () => void;
};

export function CheckInSheet({
  open,
  workoutTitle,
  rating,
  notes,
  consent,
  submitting,
  onOpenChange,
  onRatingChange,
  onNotesChange,
  onConsentChange,
  onConfirm,
  onSkip,
}: CheckInSheetProps) {
  const { vocabulary: v } = useSpaceVocabulary();
  const containerRef = useModalA11y(open, () => onOpenChange(false));

  if (!open) return null;

  const hasSensitive = rating != null || notes.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[3px]"
        aria-label="Fechar check-in"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-sheet-title"
        className="relative z-10 flex w-full max-w-lg flex-col gap-5 rounded-t-[26px] border border-b-0 border-border bg-card px-5 pb-10 pt-3 motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-300 md:rounded-[26px] md:border-b md:pb-6"
      >
        <div className="mx-auto h-1 w-9 rounded-full bg-border" aria-hidden />

        <div className="text-center">
          <h2 id="checkin-sheet-title" className="text-lg font-extrabold tracking-tight">
            {v.checkInSheetTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{workoutTitle}</p>
          <p className="text-xs text-muted-foreground">
            Ajuda o Radar a entender sua resposta ao programa.
          </p>
        </div>

        <div className="flex justify-between gap-1" role="group" aria-label="Como você se sentiu">
          {RATING_LABELS.map((label, i) => {
            const num = i + 1;
            const selected = rating === num;
            const color = RATING_COLORS[i];
            return (
              <button
                key={num}
                type="button"
                aria-label={`Sensação ${num}: ${label}`}
                aria-pressed={selected}
                onClick={() => onRatingChange(num)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg p-1 transition-transform motion-safe:duration-150",
                  selected && "motion-safe:scale-105",
                )}
              >
                <span
                  className="flex size-11 items-center justify-center rounded-full text-lg font-extrabold transition-colors"
                  style={
                    selected
                      ? { background: color, color: "hsl(215 28% 7%)" }
                      : {
                          background: `${color.replace("hsl(", "hsla(").replace(")", ", 0.14)")}`,
                          color,
                          border: `1.5px solid ${color.replace("hsl(", "hsla(").replace(")", ", 0.42)")}`,
                        }
                  }
                >
                  {num}
                </span>
                <span
                  className="text-[10.5px] font-semibold whitespace-nowrap"
                  style={{ color: selected ? color : undefined }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkin-notes" className="text-xs font-semibold text-muted-foreground">
            Nota (opcional)
          </label>
          <textarea
            id="checkin-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={v.checkInSheetNotesPlaceholder}
            className="min-h-[70px] w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {hasSensitive ? (
          <label htmlFor="checkin-consent" className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              id="checkin-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="mt-0.5"
            />
            Autorizo compartilhar sensação ou notas com meu criador.
          </label>
        ) : null}

        <Button
          size="lg"
          className="h-14 min-h-[56px] gap-2 rounded-[14px] text-base font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)] active:scale-[0.97]"
          loading={submitting}
          disabled={submitting}
          onClick={onConfirm}
        >
          {!submitting ? <CalendarCheck className="size-5" strokeWidth={2.5} aria-hidden /> : null}
          Confirmar check-in
        </Button>
        <Button variant="ghost" loading={submitting} disabled={submitting} onClick={onSkip}>
          {v.checkInSkipButton}
        </Button>
      </div>
    </div>
  );
}
