import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Dumbbell, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { pwaStorage } from "@/lib/pwa/push-utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const { toast } = useToast();
  const location = useLocation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const isStudentArea = location.pathname.startsWith("/student");

  useEffect(() => {
    if (!isStudentArea || pwaStorage.isInstallDismissed()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setDeferred(null);
      setVisible(false);
      toast("App de treinos instalado — check-in e progresso na tela inicial.");
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [toast, isStudentArea]);

  useEffect(() => {
    if (!isStudentArea) {
      setVisible(false);
    }
  }, [isStudentArea]);

  if (!isStudentArea || !visible || !deferred) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-[14px] border border-border bg-card p-4 shadow-xl md:bottom-6"
      role="region"
      aria-label="Instalar app de treinos"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-primary/30 bg-primary/10">
        <Dumbbell className="size-5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Instale seus treinos no celular</p>
        <p className="text-xs text-muted-foreground">
          Check-in rápido, streak e progresso — abre direto na área do aluno.
        </p>
      </div>
      <Button
        size="sm"
        className="gap-1.5"
        onClick={async () => {
          await deferred.prompt();
          setVisible(false);
          setDeferred(null);
        }}
      >
        <Download className="size-3.5" aria-hidden />
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
