import { Check } from "lucide-react";
import { StudentAvatar } from "@/components/creator/StudentAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EnrollStudentOption = {
  id: string;
  name: string;
  selected: boolean;
};

type EnrollStudentsModalProps = {
  open: boolean;
  programTitle: string;
  students: EnrollStudentOption[];
  saving?: boolean;
  onClose: () => void;
  onToggle: (studentId: string) => void;
  onSave: () => void;
};

export function EnrollStudentsModal({
  open,
  programTitle,
  students,
  saving,
  onClose,
  onToggle,
  onSave,
}: EnrollStudentsModalProps) {
  if (!open) return null;

  const selectedCount = students.filter((s) => s.selected).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[18px] border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enroll-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div>
            <h2 id="enroll-title" className="text-[17px] font-bold">
              Matricular alunos
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {programTitle} · selecione quem vai seguir este programa
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-[34px] items-center justify-center rounded-[9px] border border-border text-muted-foreground hover:bg-secondary"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto px-4 py-3">
          {students.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[11px] border px-3 py-2.5 text-left transition-colors",
                s.selected
                  ? "border-primary/40 bg-primary/10"
                  : "border-transparent hover:bg-secondary/60",
              )}
            >
              <StudentAvatar name={s.name} size="lg" />
              <span className="flex-1 text-[14.5px] font-semibold">{s.name}</span>
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-md",
                  s.selected
                    ? "bg-primary text-primary-foreground"
                    : "border-[1.5px] border-border",
                )}
              >
                {s.selected ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-6 py-4">
          <span className="text-[13px] text-muted-foreground">
            {selectedCount} aluno(s) selecionado(s)
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" disabled={saving} onClick={onSave}>
              {saving ? "Salvando…" : "Salvar matrículas"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
