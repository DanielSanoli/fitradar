import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import type { AlertResponse } from "@/lib/api/domain-types";
import { retentionApi } from "@/lib/api/retention-api";
import {
  alertSeverityClass,
  alertSeverityLabel,
  alertTypeLabel,
  formatAlertTimestamp,
} from "@/lib/creator/alert-copy";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function unreadBadgeLabel(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

export function RetentionAlertsInbox() {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [markingId, setMarkingId] = useState<string | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const page = await retentionApi.alerts({ unreadOnly: true, page: 0, size: 1 });
      setUnreadCount(page.totalElements);
    } catch {
      // badge is best-effort; list errors surface in panel
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setState("loading");
    setError(undefined);
    try {
      const page = await retentionApi.alerts({ page: 0, size: 30 });
      setAlerts(page.content);
      setState("content");
      await refreshUnreadCount();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar alertas.");
      setState("error");
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (open) void loadAlerts();
  }, [open, loadAlerts]);

  useEffect(() => {
    const onFocus = () => void refreshUnreadCount();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const markAsRead = async (alert: AlertResponse) => {
    if (alert.read) return;
    setMarkingId(alert.id);
    try {
      const updated = await retentionApi.markAlertRead(alert.id);
      setAlerts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível marcar como lido.", "error");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative size-9 shrink-0 rounded-[10px]"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          unreadCount > 0
            ? `Alertas do Radar, ${unreadCount} não lidos`
            : "Alertas do Radar"
        }
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-[18px]" aria-hidden />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border border-background bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground tabular-nums"
            aria-hidden
          >
            {unreadBadgeLabel(unreadCount)}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Inbox de alertas de retenção"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_16px_40px_rgba(0,0,0,0.45)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2"
        >
          <div className="border-b border-border px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold tracking-tight">Alertas do Radar</h2>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} não lido${unreadCount === 1 ? "" : "s"}`
                    : "Tudo em dia por aqui"}
                </p>
              </div>
              <Link
                to="/app/retention"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                Ver retenção
              </Link>
            </div>
          </div>

          <PanelState
            state={state === "content" && alerts.length === 0 ? "empty" : state}
            message={error}
            onRetry={loadAlerts}
            rows={3}
            className="max-h-[min(60vh,24rem)] overflow-y-auto px-2 py-2"
          >
            <ul className="flex list-none flex-col gap-1.5 p-0">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <article
                    className={cn(
                      "rounded-[11px] border px-3 py-2.5 transition-colors",
                      alert.read
                        ? "border-border/70 bg-muted/20"
                        : "border-primary/25 bg-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              alertSeverityClass(alert.severity),
                            )}
                          >
                            {alertSeverityLabel(alert.severity)}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {alertTypeLabel(alert.type)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-1.5 text-sm leading-snug",
                            alert.read ? "text-muted-foreground" : "font-medium text-foreground",
                          )}
                        >
                          {alert.message}
                        </p>
                        {alert.actionSuggestion ? (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {alert.actionSuggestion}
                          </p>
                        ) : null}
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          {formatAlertTimestamp(alert.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {!alert.read ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-[9px] px-2.5 text-xs font-semibold"
                          disabled={markingId === alert.id}
                          onClick={() => void markAsRead(alert)}
                        >
                          <Check className="size-3.5" aria-hidden />
                          {markingId === alert.id ? "Salvando…" : "Marcar como lido"}
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                          <Check className="size-3" aria-hidden />
                          Lido
                        </span>
                      )}
                      {alert.subjectStudentId ? (
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-[9px] px-2.5 text-xs font-semibold"
                        >
                          <Link to={`/app/students/${alert.subjectStudentId}`} onClick={() => setOpen(false)}>
                            Ver aluno
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </PanelState>

          <p className="border-t border-border px-4 py-2 text-center text-[10px] text-muted-foreground">
            Sugestão, não orientação médica/profissional.
          </p>
        </div>
      ) : null}
    </div>
  );
}
