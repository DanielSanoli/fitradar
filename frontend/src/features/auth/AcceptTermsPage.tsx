import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TermsAcceptanceField } from "@/components/legal/TermsAcceptanceField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { acceptTerms } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/types";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";

export function AcceptTermsPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accepted) {
      setError("Aceite os Termos de Uso e a Política de Privacidade para continuar.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await acceptTerms(true);
      await refreshUser();
      const from = (location.state as { from?: string } | null)?.from;
      navigate(resolvePostLoginRedirect(from, user?.role ?? "CREATOR"), { replace: true });    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível registrar o aceite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">
          Para continuar no FitRadar, confirme que leu e aceita nossos termos legais.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aceite obrigatório</CardTitle>
          <CardDescription>Válido para criadores e alunos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <TermsAcceptanceField checked={accepted} onCheckedChange={setAccepted} disabled={loading} />
            <Button type="submit" className="w-full" disabled={loading || !accepted}>
              {loading ? "Salvando…" : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
