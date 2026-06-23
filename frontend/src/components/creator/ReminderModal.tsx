import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReminderModalProps = {
  open: boolean;
  studentName: string;
  initialText: string;
  loading?: boolean;
  onClose: () => void;
  onSend: (text: string) => Promise<void>;
};

export function ReminderModal({
  open,
  studentName,
  initialText,
  loading,
  onClose,
  onSend,
}: ReminderModalProps) {
  const [text, setText] = useState(initialText);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setSent(false);
    }
  }, [open, initialText]);

  if (!open) return null;

  const submit = async () => {
    setSending(true);
    try {
      await onSend(text);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[540px] overflow-hidden rounded-[18px] border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10"
                aria-hidden
              >
                <span className="size-2 rotate-45 rounded-sm bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              </span>
              <h2 id="reminder-title" className="text-[17px] font-bold">
                Enviar lembrete
              </h2>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Para {studentName} · texto sugerido pelo Radar · edite à vontade
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] border border-border text-muted-foreground hover:bg-secondary"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading || sent}
            className="min-h-[130px] w-full resize-y rounded-[12px] border border-border bg-secondary/40 px-3.5 py-3 text-[14.5px] leading-relaxed focus:border-primary/55 focus:outline-none focus:ring-[3px] focus:ring-primary/15"
          />
          <div className="flex items-start gap-2 rounded-[10px] border border-border bg-secondary/30 px-3 py-2.5">
            <span className="mt-0.5 flex size-[15px] shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 text-[10px] font-bold italic text-muted-foreground">
              i
            </span>
            <p className="text-xs leading-snug text-muted-foreground">
              Sugestão do Radar com base nos dados de treino. Não substitui orientação médica ou
              psicológica.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {sent ? "Fechar" : "Cancelar"}
          </Button>
          {sent ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-primary/40 bg-primary/10 text-primary"
              disabled
            >
              <Check className="size-4" /> Lembrete enviado
            </Button>
          ) : (
            <Button
              type="button"
              disabled={sending || loading || !text.trim()}
              onClick={() => void submit()}
              className={cn("shadow-[0_4px_14px_hsl(var(--primary)/0.24)]")}
            >
              {sending ? "Enviando…" : "Enviar lembrete"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
