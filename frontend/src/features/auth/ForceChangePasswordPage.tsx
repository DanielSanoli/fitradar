import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TermsAcceptanceField } from "@/components/legal/TermsAcceptanceField";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { acceptTerms } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/types";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";

export function ForceChangePasswordPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsTerms = user?.termsAccepted === false;

  const handleSuccess = async () => {
    if (needsTerms && !acceptedTerms) {
      setError("Aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    setError(null);
    try {
      if (needsTerms) {
        await acceptTerms(true);
      }
      await refreshUser();
      const from = (location.state as { from?: string } | null)?.from;
      navigate(resolvePostLoginRedirect(from, user?.role ?? "STUDENT"), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível continuar.");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Defina sua senha</h1>
        <p className="text-sm text-muted-foreground">
          Você entrou com uma senha temporária do convite. Escolha uma senha pessoal para continuar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
          <CardDescription>Mínimo de 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {needsTerms ? (
            <TermsAcceptanceField
              checked={acceptedTerms}
              onCheckedChange={setAcceptedTerms}
              id="student-accept-terms"
            />
          ) : null}
          <ChangePasswordForm
            requireCurrentPassword={false}
            submitLabel="Continuar"
            onSuccess={() => void handleSuccess()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
