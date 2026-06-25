import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setPaymentRequiredHandler } from "@/lib/api/client";
import { startProCheckout } from "@/lib/billing/start-pro-checkout";
import { promptProUpgrade, registerProUpgradePrompt } from "@/lib/billing/pro-upgrade-prompt";

type ProUpgradeContextValue = {
  promptProUpgrade: (message: string) => void;
};

const ProUpgradeContext = createContext<ProUpgradeContextValue | null>(null);

export function useProUpgrade() {
  const ctx = useContext(ProUpgradeContext);
  if (!ctx) {
    throw new Error("useProUpgrade must be used within ProUpgradeProvider");
  }
  return ctx;
}

export function ProUpgradeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string>();

  const show = useCallback((text: string) => {
    setMessage(text);
    setCheckoutError(undefined);
    setOpen(true);
  }, []);

  useEffect(() => {
    setPaymentRequiredHandler(show);
    registerProUpgradePrompt(show);
    return () => {
      setPaymentRequiredHandler(null);
      registerProUpgradePrompt(null);
    };
  }, [show]);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    setCheckoutError(undefined);
    const result = await startProCheckout();
    if (!result.ok) {
      setCheckoutError(result.error);
    } else {
      setOpen(false);
    }
    setCheckoutLoading(false);
  };

  const value = useMemo<ProUpgradeContextValue>(
    () => ({ promptProUpgrade: show }),
    [show],
  );

  return (
    <ProUpgradeContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="pro-upgrade-desc">
          <DialogHeader>
            <DialogTitle>Plano Pro</DialogTitle>
            <DialogDescription id="pro-upgrade-desc">
              {message ||
                "Recurso disponível no plano Pro — comissão 0% nas vendas e alunos/programas ilimitados."}
            </DialogDescription>
          </DialogHeader>
          {checkoutError ? (
            <p className="text-sm text-destructive" role="alert">
              {checkoutError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" disabled={checkoutLoading} onClick={() => setOpen(false)}>
              Agora não
            </Button>
            <Button type="button" disabled={checkoutLoading} onClick={() => void handleUpgrade()}>
              {checkoutLoading ? "Redirecionando…" : "Assinar Pro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProUpgradeContext.Provider>
  );
}

export { promptProUpgrade };
