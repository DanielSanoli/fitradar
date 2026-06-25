import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { changePassword } from "@/lib/api/auth-api";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-reset-copy";
import { ApiError } from "@/lib/api/types";

type ChangePasswordFormProps = {
  requireCurrentPassword?: boolean;
  onSuccess?: () => void;
  submitLabel?: string;
  className?: string;
};

export function ChangePasswordForm({
  requireCurrentPassword = true,
  onSuccess,
  submitLabel = "Atualizar senha",
  className,
}: ChangePasswordFormProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(`A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword({
        currentPassword: requireCurrentPassword ? currentPassword : null,
        newPassword,
      });
      setSuccess(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Senha atualizada.");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className={className}>
      <div className="space-y-3">
        {requireCurrentPassword ? (
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-[42px] rounded-[11px]"
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            className="h-[42px] rounded-[11px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            className="h-[42px] rounded-[11px]"
          />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert className="mt-3" role="status">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="sm" className="mt-4" disabled={submitting}>
        {submitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
