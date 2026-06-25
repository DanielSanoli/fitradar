import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Link2, ShoppingBag, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { marketplaceApi } from "@/lib/api/marketplace-api";
import type { MarketplaceStatusResponse, ProgramPurchaseResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import {
  formatMoneyBrl,
  maskWalletId,
  purchaseStatusClass,
  purchaseStatusLabel,
} from "@/lib/creator/marketplace-copy";
import { cn } from "@/lib/utils";

function formatPurchaseDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CreatorMarketplacePage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<MarketplaceStatusResponse | null>(null);
  const [sales, setSales] = useState<ProgramPurchaseResponse[]>([]);
  const [walletId, setWalletId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const [statusResult, salesResult] = await Promise.all([
        marketplaceApi.status(),
        marketplaceApi.sales(),
      ]);
      setStatus(statusResult);
      setSales(salesResult);
      setLoadState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar marketplace.");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = walletId.trim();
    if (!trimmed) {
      toast("Informe o wallet ID da sua conta Asaas.", "error");
      return;
    }
    setConnecting(true);
    try {
      const result = await marketplaceApi.connect({ walletId: trimmed });
      setStatus(result);
      toast("Conta de recebimento conectada.");
      void load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Não foi possível conectar.", "error");
    } finally {
      setConnecting(false);
    }
  };

  const connected = status?.connected ?? false;
  const confirmedSales = sales.filter((s) => s.status === "CONFIRMED").length;

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 motion-safe:animate-in motion-safe:fade-in">
      <header className="space-y-1">
        <h1 className="text-[22px] font-extrabold tracking-tight">Vendas & recebimento</h1>
        <p className="text-sm text-muted-foreground">
          Conecte sua carteira Asaas, defina preços nos programas e acompanhe as vendas.
        </p>
      </header>

      <PanelState state={loadState} message={error} onRetry={load}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_20px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-secondary/60">
                <Wallet className="size-[18px] text-muted-foreground" aria-hidden />
              </div>
              <div>
                <h2 className="text-[15px] font-bold tracking-tight">Conta Asaas</h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Wallet ID para receber vendas de programas pagos.
                </p>
              </div>
            </div>

            {connected ? (
              <Alert className="mb-4 border-primary/30 bg-primary/10">
                <AlertDescription className="text-sm">
                  Conectado — wallet{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {maskWalletId(status?.walletId)}
                  </span>
                  {status?.platformFeePercent ? (
                    <>
                      {" "}
                      · taxa plataforma{" "}
                      <span className="font-semibold">{status.platformFeePercent}%</span>
                    </>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="warning" className="mb-4">
                <AlertDescription>
                  Sem conta conectada, alunos não conseguem comprar programas pagos.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={(e) => void handleConnect(e)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="wallet-id">Wallet ID (Asaas)</Label>
                <Input
                  id="wallet-id"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  placeholder="Ex.: wal_xxxxxxxx"
                  className="h-[46px] rounded-[11px] bg-secondary/40 font-mono text-sm"
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                disabled={connecting}
                className="h-[42px] w-full rounded-[11px] sm:w-auto"
              >
                <Link2 className="size-4" aria-hidden />
                {connecting ? "Conectando…" : connected ? "Atualizar wallet" : "Conectar conta"}
              </Button>
            </form>

            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
              Cobrança digital via web (fora das lojas). Encontre o wallet ID no painel Asaas em
              Configurações → Minha conta.
            </p>
          </section>

          <section className="rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_20px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-secondary/60">
                <ShoppingBag className="size-[18px] text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-bold tracking-tight">Programas pagos</h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Defina o preço em cada programa — vazio significa gratuito.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-[10px]" asChild>
              <Link to="/app/programs">
                <ExternalLink className="size-4" aria-hidden />
                Ir para programas
              </Link>
            </Button>
          </section>
        </div>

        <section className="mt-5 rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_20px_rgba(0,0,0,0.22)]">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight">Histórico de vendas</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {sales.length === 0
                  ? "Nenhuma venda registrada ainda."
                  : `${sales.length} venda(s) · ${confirmedSales} confirmada(s)`}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => void load()}>
              Atualizar
            </Button>
          </div>

          {sales.length === 0 ? (
            <p className="rounded-[11px] border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Quando um aluno comprar um programa pago, a venda aparecerá aqui com valores líquidos
              calculados pelo backend.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 font-bold">Programa</th>
                    <th className="pb-2 pr-3 font-bold">Aluno</th>
                    <th className="pb-2 pr-3 font-bold">Valor</th>
                    <th className="pb-2 pr-3 font-bold">Líquido</th>
                    <th className="pb-2 pr-3 font-bold">Status</th>
                    <th className="pb-2 font-bold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-3 font-semibold">{sale.programTitle}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{sale.studentName}</td>
                      <td className="py-3 pr-3">{formatMoneyBrl(sale.amount)}</td>
                      <td className="py-3 pr-3 font-medium text-primary">
                        {formatMoneyBrl(sale.creatorNet)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                            purchaseStatusClass(sale.status),
                          )}
                        >
                          {purchaseStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatPurchaseDate(sale.confirmedAt ?? sale.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </PanelState>

      <p className="text-center text-[11px] text-muted-foreground">
        Valores exibidos vêm do backend — sugestão, não orientação médica/profissional.
      </p>
    </div>
  );
}
