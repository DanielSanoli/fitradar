import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { pushApi } from "@/lib/api/push-api";
import {
  PUSH_MESSAGES,
  PushEnableTimeoutError,
  isPushServerAvailable,
  runPushEnableFlow,
  withPushTimeout,
} from "@/lib/pwa/push-enable";
import {
  pwaStorage,
  subscribeToPush,
  subscriptionToPayload,
  unsubscribePushLocally,
} from "@/lib/pwa/push-utils";
import { cn } from "@/lib/utils";

const SERVER_UNAVAILABLE_HINT = "Indisponível no servidor — push desligado (PUSH_ENABLED).";

function usePushNotifications() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(() => pwaStorage.isPushEnabled());
  const [loading, setLoading] = useState(false);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void pushApi
      .config()
      .then((config) => {
        if (!cancelled) {
          setServerAvailable(isPushServerAvailable(config));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerAvailable(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (serverAvailable === false) {
      toast(PUSH_MESSAGES.serverDisabled, "error");
      return;
    }

    setLoading(true);
    try {
      const result = await withPushTimeout(async () => {
        const config = await pushApi.config();
        setServerAvailable(isPushServerAvailable(config));
        return runPushEnableFlow(config, {
          requestPermission: () => Notification.requestPermission(),
          subscribeToPush,
          registerSubscription: (payload) => pushApi.subscribe(payload),
          subscriptionToPayload,
        });
      });

      if (!result.ok) {
        toast(result.message, "error");
        return;
      }

      pwaStorage.setPushEnabled(true);
      setEnabled(true);
      toast("Notificações ativadas.");
    } catch (error) {
      if (error instanceof PushEnableTimeoutError) {
        toast(PUSH_MESSAGES.timeout, "error");
      } else {
        toast("Erro ao ativar.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [serverAvailable, toast]);

  const disable = useCallback(async () => {
    setLoading(true);
    try {
      await withPushTimeout(async () => {
        await pushApi.unsubscribe();
        await unsubscribePushLocally();
      });
      pwaStorage.setPushEnabled(false);
      setEnabled(false);
      toast("Notificações desativadas.");
    } catch (error) {
      if (error instanceof PushEnableTimeoutError) {
        toast(PUSH_MESSAGES.timeout, "error");
      } else {
        toast("Erro ao desativar.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const test = useCallback(async () => {
    setLoading(true);
    try {
      await withPushTimeout(() => pushApi.test());
      toast("Notificação de teste enviada.");
    } catch (error) {
      if (error instanceof PushEnableTimeoutError) {
        toast(PUSH_MESSAGES.timeout, "error");
      } else {
        toast("Falha no teste de push.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    enabled,
    loading,
    serverAvailable,
    serverUnavailableHint: SERVER_UNAVAILABLE_HINT,
    enable,
    disable,
    test,
    setEnabled,
  };
}

async function runBannerEnable(
  toast: (message: string, variant?: "default" | "error") => void,
): Promise<"success" | "dismiss" | "failed"> {
  try {
    const result = await withPushTimeout(async () => {
      const config = await pushApi.config();
      if (!isPushServerAvailable(config)) {
        return { ok: false as const, message: PUSH_MESSAGES.serverDisabled };
      }
      return runPushEnableFlow(config, {
        requestPermission: () => Notification.requestPermission(),
        subscribeToPush,
        registerSubscription: (payload) => pushApi.subscribe(payload),
        subscriptionToPayload,
      });
    });

    if (!result.ok) {
      toast(result.message, "error");
      if (result.message === PUSH_MESSAGES.permissionDenied) {
        pwaStorage.dismissPush();
        return "dismiss";
      }
      return "failed";
    }

    pwaStorage.setPushEnabled(true);
    toast("Lembretes de treino ativados!");
    return "success";
  } catch (error) {
    toast(
      error instanceof PushEnableTimeoutError ? PUSH_MESSAGES.timeout : "Não foi possível ativar notificações.",
      "error",
    );
    return "failed";
  }
}

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
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void pushApi
      .config()
      .then((config) => {
        if (!cancelled) {
          setServerAvailable(isPushServerAvailable(config));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerAvailable(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    if (pwaStorage.isPushDismissed() || pwaStorage.isPushEnabled()) return;
    if (!("Notification" in window) || Notification.permission !== "default") return;
    const t = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(t);
  }, [show]);

  const enable = useCallback(async () => {
    if (serverAvailable === false) {
      toast(PUSH_MESSAGES.serverDisabled, "error");
      return;
    }

    setLoading(true);
    try {
      const outcome = await runBannerEnable(toast);
      if (outcome === "success" || outcome === "dismiss") {
        setVisible(false);
      }
    } finally {
      setLoading(false);
    }
  }, [serverAvailable, toast]);

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
            {serverAvailable === false
              ? SERVER_UNAVAILABLE_HINT
              : "Receba um toque quando for hora de voltar aos treinos."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={loading || serverAvailable === false}
              aria-busy={loading}
              onClick={() => void enable()}
            >
              Ativar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={loading}
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
            {push.serverAvailable === false
              ? push.serverUnavailableHint
              : push.enabled
                ? "Lembretes do Radar ativos."
                : "Receba lembretes de treino no celular."}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {push.enabled ? (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={push.loading}
              aria-busy={push.loading}
              onClick={() => void push.test()}
            >
              Testar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={push.loading}
              aria-busy={push.loading}
              onClick={() => void push.disable()}
            >
              Desativar
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            disabled={push.loading || push.serverAvailable === false}
            aria-busy={push.loading}
            onClick={() => void push.enable()}
          >
            Ativar notificações
          </Button>
        )}
      </div>
    </div>
  );
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

  const switchDisabled = push.loading || push.serverAvailable === false;

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
          {push.serverAvailable === false
            ? push.serverUnavailableHint
            : push.enabled
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
        disabled={switchDisabled}
        onClick={() => void (push.enabled ? push.disable() : push.enable())}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-60",
          push.enabled ? "border-primary/50 bg-primary" : "border-border bg-muted",
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

export { usePushNotifications };
