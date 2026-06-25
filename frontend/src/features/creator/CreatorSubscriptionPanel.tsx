import { useCallback, useEffect, useState } from "react";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { billingApi } from "@/lib/api/billing-api";
import type {
  SubscriptionDetailsResponse,
  SubscriptionInvoiceResponse,
} from "@/lib/api/billing-api";
import { ApiError } from "@/lib/api/types";
import {
  formatBillingDate,
  invoiceStatusClass,
  invoiceStatusLabel,
} from "@/lib/creator/billing-copy";
import { formatMoneyBrl } from "@/lib/creator/marketplace-copy";
import {
  planLabel,
  subscriptionStatusLabel,
} from "@/lib/creator/settings-copy";
import { startProCheckout } from "@/lib/billing/start-pro-checkout";
import { cn } from "@/lib/utils";

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/80 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function CreatorSubscriptionPanel() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const [details, setDetails] = useState<SubscriptionDetailsResponse | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoiceResponse[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState<string>();

  const load = useCallback(async () => {
    setLoadState("loading");
    setError(undefined);
    try {
      const [detailsResult, invoicesResult] = await Promise.all([
        billingApi.subscriptionDetails(),
        billingApi.subscriptionInvoices(),
      ]);
      setDetails(detailsResult);
      setInvoices(invoicesResult);
      setLoadState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível carregar a assinatura.");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setActionError(undefined);
    const result = await startProCheckout();
    if (!result.ok) {
      setActionError(result.error);
    }
    setCheckoutLoading(false);
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Cancelar assinatura Pro?",
      description:
        "A cobrança será interrompida no Asaas. Você mantém o acesso até o fim do ciclo já pago, conforme a política da assinatura.",
      confirmLabel: "Cancelar assinatura",
      cancelLabel: "Manter Pro",
      destructive: true,
    });
    if (!ok) return;

    setCancelLoading(true);
    setActionError(undefined);
    try {
      const result = await billingApi.cancelSubscription();
      toast(result.message);
      await refreshUser();
      await load();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Não foi possível cancelar.");
    } finally {
      setCancelLoading(false);
    }
  };

  const activePro =
    details?.plan === "PRO" && details?.status === "ACTIVE";
  const subscribeLabel =
    details?.status === "CANCELED" ? "Reativar Pro" : "Assinar Pro";

  return (
    <>
      {confirmDialog}
      <PanelState state={loadState} message={error} onRetry={load}>
        <FieldRow
          label="Plano"
          value={details ? planLabel(details.plan) : user ? planLabel(user.plan) : "—"}
        />
        <FieldRow
          label="Status"
          value={
            details
              ? subscriptionStatusLabel(details.status)
              : user
                ? subscriptionStatusLabel(user.subscriptionStatus)
                : "—"
          }
        />
        <FieldRow
          label="Trial restante"
          value={
            details && details.trialDaysRemaining > 0
              ? `${details.trialDaysRemaining} dia${details.trialDaysRemaining === 1 ? "" : "s"}`
              : details?.plan === "PRO"
                ? "—"
                : "Encerrado"
          }
        />
        {details?.subscriptionEndsAt ? (
          <FieldRow
            label="Próxima renovação"
            value={formatBillingDate(details.subscriptionEndsAt)}
          />
        ) : null}

        {user?.accessMessage && !user.accessAllowed ? (
          <Alert variant="warning" className="mt-3">
            <AlertDescription>{user.accessMessage}</AlertDescription>
          </Alert>
        ) : null}

        {details?.message ? (
          <Alert className="mt-3 border-border bg-secondary/30">
            <AlertDescription>{details.message}</AlertDescription>
          </Alert>
        ) : null}

        {actionError ? (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {details?.canReactivate ? (
            <Button
              type="button"
              disabled={checkoutLoading || cancelLoading}
              onClick={() => void handleCheckout()}
            >
              {checkoutLoading ? "Redirecionando…" : subscribeLabel}
            </Button>
          ) : null}
          {activePro ? (
            <Button type="button" variant="secondary" disabled>
              Plano Pro ativo
            </Button>
          ) : null}
          {details?.canCancel ? (
            <Button
              type="button"
              variant="destructive"
              disabled={cancelLoading || checkoutLoading}
              onClick={() => void handleCancel()}
            >
              {cancelLoading ? "Cancelando…" : "Cancelar assinatura"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/app/marketplace">
              <ShoppingBag className="size-4" aria-hidden />
              Vendas de programas pagos
            </Link>
          </Button>
        </div>

        {invoices.length > 0 ? (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold tracking-tight">Faturas recentes</h3>
            <div className="overflow-x-auto rounded-[11px] border border-border">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[12px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-semibold">Vencimento</th>
                    <th className="px-3 py-2.5 font-semibold">Valor</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-3 py-2.5 font-semibold">Pago em</th>
                    <th className="px-3 py-2.5 font-semibold">
                      <span className="sr-only">Boleto / fatura</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border/70 last:border-0">
                      <td className="px-3 py-3">{formatBillingDate(invoice.dueDate)}</td>
                      <td className="px-3 py-3 font-medium">{formatMoneyBrl(invoice.value)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                            invoiceStatusClass(invoice.status),
                          )}
                        >
                          {invoiceStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3">{formatBillingDate(invoice.paymentDate)}</td>
                      <td className="px-3 py-3">
                        {invoice.invoiceUrl ? (
                          <a
                            href={invoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            Ver fatura
                            <ExternalLink className="size-3" aria-hidden />
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </PanelState>
    </>
  );
}
