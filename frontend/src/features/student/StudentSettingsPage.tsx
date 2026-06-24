import { useCallback, useEffect, useState } from "react";
import { Bell, ExternalLink, LogOut, Shield, User } from "lucide-react";
import { PushNotificationSwitch } from "@/components/pwa/PushPrompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { requestPasswordReset } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function SettingsSectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: typeof User;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = `student-settings-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section
      className={cn(
        "rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_20px_rgba(0,0,0,0.22)]",
        className,
      )}
      aria-labelledby={headingId}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-primary/10">
          <Icon className="size-[18px] text-primary" aria-hidden />
        </div>
        <div>
          <h2 id={headingId} className="text-[15px] font-bold tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/80 py-3 last:border-0">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function StudentSettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();

  const [accountState, setAccountState] = useState<"loading" | "error" | "content">("loading");
  const [accountError, setAccountError] = useState<string>();
  const [passwordSending, setPasswordSending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string>();

  const loadAccount = useCallback(async () => {
    setAccountState("loading");
    setAccountError(undefined);
    try {
      await refreshUser();
      setAccountState("content");
    } catch (e) {
      setAccountError(e instanceof ApiError ? e.message : "Não foi possível carregar sua conta.");
      setAccountState("error");
    }
  }, [refreshUser]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    setPasswordSending(true);
    setPasswordMessage(undefined);
    try {
      const res = await requestPasswordReset(user.email);
      setPasswordMessage(res.message);
      toast("Link de redefinição enviado para seu e-mail.");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Falha ao solicitar redefinição.", "error");
    } finally {
      setPasswordSending(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Conta, lembretes de treino e preferências da sua jornada.
        </p>
      </header>

      <PanelState state={accountState} message={accountError} onRetry={loadAccount}>
        <SettingsSectionCard
          title="Conta"
          description="Seus dados de acesso na plataforma."
          icon={User}
        >
          <FieldRow label="Nome" value={user?.name ?? "—"} />
          <FieldRow label="E-mail" value={user?.email ?? "—"} />

          <div className="mt-4 rounded-[11px] border border-border bg-secondary/30 px-4 py-3.5">
            <p className="text-sm font-semibold">Trocar senha</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Enviaremos um link de redefinição para{" "}
              <span className="font-medium text-foreground">{user?.email ?? "seu e-mail"}</span>.
            </p>
            {passwordMessage ? (
              <Alert className="mt-3" role="status" aria-live="polite">
                <AlertDescription>{passwordMessage}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={passwordSending || !user?.email}
              onClick={() => void sendPasswordReset()}
            >
              {passwordSending ? "Enviando…" : "Enviar link por e-mail"}
            </Button>
          </div>
        </SettingsSectionCard>
      </PanelState>

      <SettingsSectionCard
        title="Notificações"
        description="Lembretes push para manter o ritmo nos treinos."
        icon={Bell}
      >
        <PushNotificationSwitch />
      </SettingsSectionCard>

      <SettingsSectionCard title="Sessão" description="Encerrar acesso neste dispositivo." icon={LogOut}>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => logout()}
        >
          <LogOut className="size-4" aria-hidden />
          Sair
        </Button>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Privacidade"
        description="Como tratamos seus dados no FitRadar."
        icon={Shield}
      >
        <a
          href="/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Política de Privacidade
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </SettingsSectionCard>
    </div>
  );
}
