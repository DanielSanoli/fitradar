import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { pwaStorage } from "@/lib/pwa/push-utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const { toast } = useToast();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pwaStorage.isInstallDismissed()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setDeferred(null);
      setVisible(false);
      toast("FitRadar instalado no seu celular!");
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [toast]);

  if (!visible || !deferred) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-[14px] border border-border bg-card p-4 shadow-xl md:bottom-6"
      role="region"
      aria-label="Instalar aplicativo"
    >
      <Download className="size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Instalar FitRadar</p>
        <p className="text-xs text-muted-foreground">Acesso rápido aos treinos no celular.</p>
      </div>
      <Button
        size="sm"
        onClick={async () => {
          await deferred.prompt();
          setVisible(false);
          setDeferred(null);
        }}
      >
        Instalar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Fechar"
        onClick={() => {
          pwaStorage.dismissInstall();
          setVisible(false);
        }}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
