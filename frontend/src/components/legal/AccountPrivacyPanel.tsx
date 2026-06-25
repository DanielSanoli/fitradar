import { useState } from "react";
import { Download, ExternalLink, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { deleteMyAccount, downloadMyDataExport } from "@/lib/api/auth-api";
import { LEGAL_LINKS } from "@/lib/legal/constants";
import { ApiError } from "@/lib/api/types";

export function AccountPrivacyPanel() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleExport = async () => {
    setExportLoading(true);
    setError(undefined);
    try {
      await downloadMyDataExport();
      toast("Exportação iniciada — verifique o arquivo JSON baixado.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível exportar seus dados.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async () => {
    const trimmed = confirmEmail.trim();
    if (!trimmed) {
      setError("Informe seu e-mail para confirmar a exclusão.");
      return;
    }

    const ok = await confirm({
      title: "Excluir conta permanentemente?",
      description:
        "Esta ação remove ou anonimiza seus dados pessoais conforme a LGPD. Não pode ser desfeita.",
      confirmLabel: "Excluir minha conta",
      cancelLabel: "Cancelar",
      destructive: true,
    });
    if (!ok) return;

    setDeleteLoading(true);
    setError(undefined);
    try {
      const result = await deleteMyAccount(trimmed);
      toast(result.message);
      logout();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível excluir a conta.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {confirmDialog}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href={LEGAL_LINKS.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            Termos de Uso
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <a
            href={LEGAL_LINKS.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            Política de Privacidade
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Exporte uma cópia dos seus dados ou exclua sua conta. Valores de métricas e aderência vêm do
          motor de retenção — a exportação reflete apenas o que está armazenado na sua conta.
        </p>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={exportLoading || deleteLoading}
          onClick={() => void handleExport()}
        >
          <Download className="size-4" aria-hidden />
          {exportLoading ? "Exportando…" : "Exportar meus dados"}
        </Button>

        <div className="rounded-[11px] border border-[hsl(var(--risk-high)/0.35)] bg-[hsl(var(--risk-high)/0.08)] px-4 py-3.5">
          <p className="text-sm font-semibold text-[hsl(0_82%_80%)]">Excluir conta</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Digite <span className="font-medium text-foreground">{user?.email ?? "seu e-mail"}</span> para
            confirmar.
          </p>
          <div className="mt-3 space-y-2">
            <Label htmlFor="confirm-delete-email" className="sr-only">
              Confirmar e-mail
            </Label>
            <Input
              id="confirm-delete-email"
              type="email"
              autoComplete="email"
              placeholder="Confirme seu e-mail"
              value={confirmEmail}
              disabled={deleteLoading}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
            <Button
              type="button"
              variant="destructive"
              className="w-full gap-2"
              disabled={deleteLoading || exportLoading}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="size-4" aria-hidden />
              {deleteLoading ? "Excluindo…" : "Excluir minha conta"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
