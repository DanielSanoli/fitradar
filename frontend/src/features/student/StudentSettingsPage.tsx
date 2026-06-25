import { useCallback, useEffect, useState } from "react";
import { Bell, LogOut, MonitorSmartphone, Shield, User } from "lucide-react";
import { AccountPrivacyPanel } from "@/components/legal/AccountPrivacyPanel";
import { EmailVerificationSection } from "@/components/auth/EmailVerificationSection";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { SessionsPanel } from "@/components/auth/SessionsPanel";
import { ProfileEditForm } from "@/components/auth/ProfileEditForm";
import { PushNotificationSwitch } from "@/components/pwa/PushPrompt";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useAuth } from "@/hooks/useAuth";
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

export function StudentSettingsPage() {
  const { user, logout, refreshUser } = useAuth();

  const [accountState, setAccountState] = useState<"loading" | "error" | "content">("loading");
  const [accountError, setAccountError] = useState<string>();

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

  const handleProfileUpdated = async () => {
    await refreshUser();
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
          description="Edite nome, e-mail e senha."
          icon={User}
        >
          {user ? (
            <ProfileEditForm user={user} onUpdated={() => void handleProfileUpdated()} />
          ) : null}

          <EmailVerificationSection
            className="mt-4"
            emailVerified={user?.emailVerified ?? false}
            email={user?.email}
            onVerified={() => void refreshUser()}
          />

          <div className="mt-4 rounded-[11px] border border-border bg-secondary/30 px-4 py-3.5">
            <p className="text-sm font-semibold">Trocar senha</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Informe a senha atual para definir uma nova.
            </p>
            <ChangePasswordForm className="mt-3" onSuccess={() => void logout()} />
          </div>
        </SettingsSectionCard>
      </PanelState>

      <SettingsSectionCard
        title="Sessões e dispositivos"
        description="Veja onde sua conta está conectada e encerre acessos."
        icon={MonitorSmartphone}
      >
        <SessionsPanel />
      </SettingsSectionCard>

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
          onClick={() => void logout()}
        >
          <LogOut className="size-4" aria-hidden />
          Sair
        </Button>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Privacidade e dados"
        description="Termos, exportação LGPD e exclusão de conta."
        icon={Shield}
      >
        <AccountPrivacyPanel />
      </SettingsSectionCard>
    </div>
  );
}
