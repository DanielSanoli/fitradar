import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { pushApi } from "@/lib/api/push-api";
import {
  pwaStorage,
  subscribeToPush,
  subscriptionToPayload,
  unsubscribePushLocally,
} from "@/lib/pwa/push-utils";
import { cn } from "@/lib/utils";

/** Banner opt-in — aparece após ação relevante (ex.: check-in). */
export function PushOptInBanner({
  show,
  className,
}: {
  show: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (pwaStorage.isPushDismissed() || pwaStorage.isPushEnabled()) return;
    if (!("Notification" in window) || Notification.permission !== "default") return;
    const t = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(t);
  }, [show]);

  const enable = useCallback(async () => {
    setLoading(true);
    try {
      const config = await pushApi.config();
      if (!config.enabled || !config.publicKey) {
        toast("Push não disponível no servidor.", "error");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        pwaStorage.dismissPush();
        setVisible(false);
        return;
      }
      const sub = await subscribeToPush(config.publicKey);
      if (!sub) throw new Error("subscription failed");
      await pushApi.subscribe(subscriptionToPayload(sub));
      pwaStorage.setPushEnabled(true);
      setVisible(false);
      toast("Lembretes de treino ativados!");
    } catch {
      toast("Não foi possível ativar notificações.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  if (!visible) return null;

  return (
    <div
      className={cn("rounded-[14px] border border-primary/30 bg-primary/5 p-4", className)}
      role="region"
      aria-label="Ativar notificações"
    >
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 size-5 text-primary" aria-hidden />
        <div className="flex-1">
          <p className="text-sm font-semibold">Lembretes de treino</p>
          <p className="text-xs text-muted-foreground">
            Receba um toque quando for hora de voltar aos treinos.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={loading} onClick={() => void enable()}>
              Ativar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                pwaStorage.dismissPush();
                setVisible(false);
              }}
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Painel de configurações — reativar/desativar push. */
export function PushSettingsCard({ className }: { className?: string }) {
  const push = usePushNotifications();

  return (
    <div className={cn("rounded-[14px] border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-3">
        {push.enabled ? (
          <Bell className="size-5 text-primary" aria-hidden />
        ) : (
          <BellOff className="size-5 text-muted-foreground" aria-hidden />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold">Notificações push</p>
          <p className="text-xs text-muted-foreground">
            {push.enabled ? "Lembretes do Radar ativos." : "Receba lembretes de treino no celular."}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {push.enabled ? (
          <>
            <Button size="sm" variant="outline" disabled={push.loading} onClick={() => void push.test()}>
              Testar
            </Button>
            <Button size="sm" variant="ghost" disabled={push.loading} onClick={() => void push.disable()}>
              Desativar
            </Button>
          </>
        ) : (
          <Button size="sm" disabled={push.loading} onClick={() => void push.enable()}>
            Ativar notificações
          </Button>
        )}
      </div>
    </div>
  );
}

function usePushNotifications() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(() => pwaStorage.isPushEnabled());
  const [loading, setLoading] = useState(false);

  const enable = async () => {
    setLoading(true);
    try {
      const config = await pushApi.config();
      if (!config.enabled || !config.publicKey) {
        toast("Push não configurado no servidor.", "error");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast("Permissão negada.", "error");
        return;
      }
      const sub = await subscribeToPush(config.publicKey);
      if (!sub) throw new Error("fail");
      await pushApi.subscribe(subscriptionToPayload(sub));
      pwaStorage.setPushEnabled(true);
      setEnabled(true);
      toast("Notificações ativadas.");
    } catch {
      toast("Erro ao ativar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setLoading(true);
    try {
      await pushApi.unsubscribe();
      await unsubscribePushLocally();
      pwaStorage.setPushEnabled(false);
      setEnabled(false);
      toast("Notificações desativadas.");
    } catch {
      toast("Erro ao desativar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    setLoading(true);
    try {
      await pushApi.test();
      toast("Notificação de teste enviada.");
    } catch {
      toast("Falha no teste de push.", "error");
    } finally {
      setLoading(false);
    }
  };

  return { enabled, loading, enable, disable, test, setEnabled };
}

/** Toggle acessível — liga/desliga push (subscribe / unsubscribe). */
export function PushNotificationSwitch({
  className,
  labelId = "push-notifications-label",
}: {
  className?: string;
  labelId?: string;
}) {
  const push = usePushNotifications();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-[11px] border border-border bg-secondary/20 px-4 py-3.5",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p id={labelId} className="text-sm font-semibold">
          Lembretes de treino
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {push.enabled
            ? "Push ativo — o Radar pode te avisar no celular."
            : "Receba um toque quando for hora de voltar aos treinos."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={push.enabled}
        aria-labelledby={labelId}
        aria-busy={push.loading}
        disabled={push.loading}
        onClick={() => void (push.enabled ? push.disable() : push.enable())}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-60",
          push.enabled
            ? "border-primary/50 bg-primary"
            : "border-border bg-muted",
        )}
      >
        <span
          className={cn(
            "pointer-events-none block size-5 rounded-full bg-background shadow transition-transform",
            push.enabled ? "translate-x-[22px]" : "translate-x-0.5",
          )}
          aria-hidden
        />
        <span className="sr-only">{push.enabled ? "Desativar notificações" : "Ativar notificações"}</span>
      </button>
    </div>
  );
}
