import { useLocation, Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

type BillingLocationState = {
  message?: string;
};

export function BillingRequiredPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const message =
    (location.state as BillingLocationState | null)?.message ??
    user?.accessMessage ??
    "Sua assinatura precisa de atenção para acessar este recurso.";

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ checkoutUrl?: string }>(`${API_PREFIX}/billing/checkout/pro`);
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }
      setError("Checkout indisponível no momento.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Assinatura necessária</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            <AlertTitle>Acesso limitado</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={startCheckout} disabled={loading}>
              {loading ? "Redirecionando…" : "Assinar o Pro"}
            </Button>
            <Button asChild variant="outline">
              <Link to="/app">Voltar ao painel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
