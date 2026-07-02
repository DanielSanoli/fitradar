import { useEffect, useState } from "react";
import { AlertTriangle, Check, Info, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type InviteStudentModalProps = {
  open: boolean;
  onClose: () => void;
  onInvite: (name: string, email: string) => Promise<void>;
  inviting?: boolean;
  /** After successful invite or resend */
  result?: { name: string; email: string; temporaryPassword: string; emailSent: boolean } | null;
  onClearResult?: () => void;
  spaceLink?: string | null;
};

export function InviteStudentModal({
  open,
  onClose,
  onInvite,
  inviting,
  result,
  onClearResult,
  spaceLink,
}: InviteStudentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [mode, setMode] = useState<"form" | "success">("form");

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setMode("form");
      setCopied(false);
      setCopiedCredentials(false);
    }
  }, [open]);

  useEffect(() => {
    if (result) setMode("success");
  }, [result]);

  if (!open) return null;

  const copySpace = async () => {
    if (!spaceLink) return;
    await navigator.clipboard.writeText(spaceLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const copyCredentials = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(
      `E-mail: ${result.email}\nSenha: ${result.temporaryPassword}`,
    );
    setCopiedCredentials(true);
    window.setTimeout(() => setCopiedCredentials(false), 2200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onInvite(name.trim(), email.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[500px] overflow-hidden rounded-[18px] border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 id="invite-title" className="text-[17px] font-bold">
              Convidar aluno
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {mode === "form"
                ? "Informe nome e e-mail · senha temporária gerada automaticamente"
                : "Compartilhe as credenciais com segurança"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-[34px] items-center justify-center rounded-[9px] border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {mode === "form" ? (
          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Nome</Label>
              <Input
                id="inv-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Lucas Ferreira"
                className="h-[46px] rounded-[11px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">E-mail</Label>
              <Input
                id="inv-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aluno@email.com"
                className="h-[46px] rounded-[11px]"
              />
            </div>
            {spaceLink ? (
              <div className="flex items-start gap-2.5 rounded-[11px] border border-border bg-secondary/40 px-3.5 py-3">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Link do seu espaço:{" "}
                  <span className="font-mono text-foreground/90">{spaceLink}</span>
                </p>
              </div>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={inviting} className="gap-2 shadow-[0_4px_18px_hsl(var(--primary)/0.28)]">
                <UserPlus className="size-4" aria-hidden />
                {inviting ? "Convidando…" : "Convidar aluno"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 px-6 py-5">
            {result ? (
              result.emailSent ? (
                <div className="space-y-3 rounded-[12px] border border-primary/25 bg-primary/5 p-4 text-sm">
                  <p>
                    <span className="font-semibold">{result.name}</span> convidado com sucesso.
                  </p>
                  <p>
                    E-mail: <strong>{result.email}</strong>
                  </p>
                  <p>
                    Senha temporária:{" "}
                    <strong className="font-mono">{result.temporaryPassword}</strong>
                  </p>
                  <p className="text-muted-foreground">
                    As credenciais também foram enviadas por e-mail.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 rounded-[12px] border border-amber-500/35 bg-amber-500/10 p-4 text-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-100">
                        Não conseguimos enviar o e-mail.
                      </p>
                      <p className="leading-relaxed text-foreground/90">
                        Passe estas credenciais ao aluno: e-mail{" "}
                        <strong>{result.email}</strong> + senha{" "}
                        <strong className="font-mono">{result.temporaryPassword}</strong>
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-10 gap-2",
                      copiedCredentials && "border-primary/40 text-primary",
                    )}
                    onClick={() => void copyCredentials()}
                  >
                    {copiedCredentials ? (
                      <>
                        <Check className="size-4" aria-hidden /> Copiado
                      </>
                    ) : (
                      "Copiar credenciais"
                    )}
                  </Button>
                </div>
              )
            ) : null}
            <div className="flex items-start gap-2.5 rounded-[11px] border border-border bg-secondary/40 px-3.5 py-3">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Quando o aluno acessar com essas credenciais, ele entra direto no seu espaço no FitRadar.
              </p>
            </div>
            {spaceLink ? (
              <div className="flex gap-2">
                <div className="flex h-[46px] min-w-0 flex-1 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[11px] border border-border bg-secondary/60 px-3.5 font-mono text-[13.5px]">
                  {spaceLink}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("h-[46px] shrink-0 px-4", copied && "border-primary/40 text-primary")}
                  onClick={() => void copySpace()}
                >
                  {copied ? (
                    <>
                      <Check className="size-4" /> Copiado
                    </>
                  ) : (
                    "Copiar"
                  )}
                </Button>
              </div>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClearResult?.();
                  setMode("form");
                }}
              >
                Convidar outro
              </Button>
              <Button type="button" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
