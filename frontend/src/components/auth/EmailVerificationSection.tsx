import { useState } from "react";
import { BadgeCheck, MailWarning } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { resendVerificationEmail } from "@/lib/api/auth-api";
import { RESEND_VERIFICATION_SUCCESS } from "@/lib/auth/email-verification-copy";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type EmailVerificationSectionProps = {
  emailVerified: boolean;
  email?: string | null;
  onVerified?: () => void;
  className?: string;
};

export function EmailVerificationSection({
  emailVerified,
  email,
  onVerified,
  className,
}: EmailVerificationSectionProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string>();

  const resend = async () => {
    setSending(true);
    setNotice(undefined);
    try {
      const res = await resendVerificationEmail();
      setNotice(res.message || RESEND_VERIFICATION_SUCCESS);
      toast("Link de verificação enviado.");
      onVerified?.();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Falha ao reenviar verificação.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-[11px] border border-border bg-secondary/30 px-4 py-3.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">E-mail verificado</p>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            emailVerified
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-[hsl(var(--risk-high)/0.35)] bg-[hsl(var(--risk-high)/0.12)] text-[hsl(var(--risk-high))]",
          )}
          role="status"
        >
          {emailVerified ? (
            <>
              <BadgeCheck className="size-3.5" aria-hidden />
              Verificado
            </>
          ) : (
            <>
              <MailWarning className="size-3.5" aria-hidden />
              Pendente
            </>
          )}
        </span>
      </div>

      {!emailVerified ? (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Confirme{" "}
            <span className="font-medium text-foreground">{email ?? "seu e-mail"}</span> para
            receber avisos importantes da plataforma.
          </p>
          {notice ? (
            <Alert className="mt-3" role="status" aria-live="polite">
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={sending || !email}
            onClick={() => void resend()}
          >
            {sending ? "Enviando…" : "Reenviar verificação"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
