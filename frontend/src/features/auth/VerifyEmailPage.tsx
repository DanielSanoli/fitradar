import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/PageLoader";
import { useAuth } from "@/hooks/useAuth";
import { verifyEmail } from "@/lib/api/auth-api";
import { VERIFY_EMAIL_SUCCESS } from "@/lib/auth/email-verification-copy";
import { ApiError } from "@/lib/api/types";

type VerifyEmailPageProps = {
  token: string;
};

export function VerifyEmailPage({ token }: VerifyEmailPageProps) {
  const { refreshUser, isAuthenticated } = useAuth();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>(VERIFY_EMAIL_SUCCESS);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const res = await verifyEmail(token);
        setMessage(res.message || VERIFY_EMAIL_SUCCESS);
        setState("success");
        if (isAuthenticated) {
          await refreshUser();
        }
      } catch (err) {
        const text =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Não foi possível verificar seu e-mail.";
        setMessage(text);
        setState("error");
      }
    })();
  }, [token, isAuthenticated, refreshUser]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Verificar e-mail</h1>
        <p className="text-sm text-muted-foreground">
          Confirmando seu endereço de e-mail no FitRadar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirmação</CardTitle>
          <CardDescription>Link enviado após cadastro ou reenvio nas configurações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" ? (
            <div className="flex flex-col items-center gap-3 py-6" role="status" aria-live="polite">
              <PageLoader />
              <p className="text-sm text-muted-foreground">Validando seu link…</p>
            </div>
          ) : null}

          {state === "success" ? (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {state === "error" ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {state !== "loading" ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/login">Ir para o login</Link>
              </Button>
              {state === "error" ? (
                <Button asChild variant="outline">
                  <Link to="/login">Reenviar nas configurações após entrar</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
