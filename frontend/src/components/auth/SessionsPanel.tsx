import { useCallback, useEffect, useState } from "react";
import { Laptop, LogOut, MonitorSmartphone, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { listSessions, revokeSession } from "@/lib/api/auth-api";
import type { UserSession } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type SessionsPanelProps = {
  className?: string;
};

export function SessionsPanel({ className }: SessionsPanelProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(undefined);
    try {
      const data = await listSessions();
      setSessions(data);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível carregar as sessões.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRevoke = async (session: UserSession) => {
    setRevokingId(session.id);
    try {
      await revokeSession(session.id);
      if (session.current) {
        toast("Sessão encerrada.");
        logout();
        return;
      }
      toast("Sessão encerrada.");
      await load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível encerrar a sessão.", "error");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <PanelState state={state} message={error} onRetry={() => void load()}>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão ativa no momento.</p>
        ) : (
          <ul className="space-y-2" aria-label="Sessões ativas">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-3 rounded-[11px] border border-border bg-secondary/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card">
                    <MonitorSmartphone className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {session.deviceLabel}
                      {session.current ? (
                        <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          Este dispositivo
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      Ativo desde {dateFormatter.format(new Date(session.createdAt))}
                      {session.ipAddress ? ` · IP ${session.ipAddress}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  disabled={revokingId === session.id}
                  onClick={() => void handleRevoke(session)}
                >
                  <LogOut className="size-3.5" aria-hidden />
                  {revokingId === session.id ? "Encerrando…" : "Encerrar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PanelState>

      <div className="flex items-start gap-2 rounded-[11px] border border-dashed border-border bg-muted/20 px-3 py-2.5 text-[12px] text-muted-foreground">
        <Shield className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <p>
          Autenticação em dois fatores (2FA) estará disponível em uma atualização futura.
        </p>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Laptop className="size-3.5" aria-hidden />
        <span>Trocar a senha encerra todas as sessões em todos os dispositivos.</span>
      </div>
    </div>
  );
}
