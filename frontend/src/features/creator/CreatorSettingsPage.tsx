import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {

  Bell,

  CreditCard,

  ExternalLink,

  LogOut,

  MonitorSmartphone,

  Shield,

  Sparkles,

  User,

} from "lucide-react";

import { EmailVerificationSection } from "@/components/auth/EmailVerificationSection";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

import { ProfileEditForm } from "@/components/auth/ProfileEditForm";

import { SessionsPanel } from "@/components/auth/SessionsPanel";

import { FilterPill } from "@/components/creator/FilterPill";

import { PushSettingsCard } from "@/components/pwa/PushPrompt";

import { Button } from "@/components/ui/button";

import { PanelState } from "@/components/ui/PanelState";

import { useToast } from "@/components/ui/toast";

import { CreatorSubscriptionPanel } from "@/features/creator/CreatorSubscriptionPanel";
import { AccountPrivacyPanel } from "@/components/legal/AccountPrivacyPanel";

import { useAuth } from "@/hooks/useAuth";

import type { DigestFrequency } from "@/lib/api/user-settings-api";

import { userSettingsApi } from "@/lib/api/user-settings-api";

import { ApiError } from "@/lib/api/types";

import {

  DIGEST_FREQUENCY_OPTIONS,

  SETTINGS_SECTIONS,

  type SettingsSection,

} from "@/lib/creator/settings-copy";

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

  return (

    <section

      className={cn(

        "rounded-[14px] border border-border bg-card p-5 shadow-[0_6px_20px_rgba(0,0,0,0.22)]",

        className,

      )}

      aria-labelledby={`settings-${title.replace(/\s+/g, "-").toLowerCase()}`}

    >

      <div className="mb-4 flex items-start gap-3">

        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-secondary/60">

          <Icon className="size-[18px] text-muted-foreground" aria-hidden />

        </div>

        <div>

          <h2

            id={`settings-${title.replace(/\s+/g, "-").toLowerCase()}`}

            className="text-[15px] font-bold tracking-tight"

          >

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



export function CreatorSettingsPage() {

  const { user, logout, refreshUser } = useAuth();

  const { toast } = useToast();

  const [section, setSection] = useState<SettingsSection>("account");



  const [accountState, setAccountState] = useState<"loading" | "error" | "content">("loading");

  const [accountError, setAccountError] = useState<string>();



  const [settingsState, setSettingsState] = useState<"loading" | "error" | "content">("loading");

  const [settingsError, setSettingsError] = useState<string>();

  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>("WEEKLY");

  const [savingDigest, setSavingDigest] = useState(false);



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



  const loadSettings = useCallback(async () => {

    setSettingsState("loading");

    setSettingsError(undefined);

    try {

      const data = await userSettingsApi.get();

      setDigestFrequency(data.digestFrequency);

      setSettingsState("content");

    } catch (e) {

      setSettingsError(e instanceof ApiError ? e.message : "Preferências indisponíveis.");

      setSettingsState("error");

    }

  }, []);



  useEffect(() => {

    void loadAccount();

  }, [loadAccount]);



  useEffect(() => {

    if (section === "notifications") {

      void loadSettings();

    }

  }, [section, loadSettings]);



  const saveDigestFrequency = async (value: DigestFrequency) => {

    setDigestFrequency(value);

    setSavingDigest(true);

    try {

      await userSettingsApi.update({ digestFrequency: value });

      toast("Preferência de digest salva.");

    } catch (e) {

      toast(e instanceof ApiError ? e.message : "Erro ao salvar.", "error");

      void loadSettings();

    } finally {

      setSavingDigest(false);

    }

  };



  return (

    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">

      <header>

        <h1 className="text-xl font-extrabold tracking-tight">Configurações</h1>

        <p className="text-sm text-muted-foreground">

          Conta, assinatura, notificações e atalhos do seu espaço.

        </p>

      </header>



      <nav

        className="flex flex-wrap gap-2"

        aria-label="Seções de configurações"

      >

        {SETTINGS_SECTIONS.map((s) => (

          <FilterPill

            key={s.id}

            label={s.label}

            active={section === s.id}

            onClick={() => setSection(s.id)}

          />

        ))}

      </nav>



      {section === "account" ? (

        <PanelState state={accountState} message={accountError} onRetry={loadAccount}>

          <SettingsSectionCard

            title="Conta"

            description="Nome, e-mail e senha de acesso."

            icon={User}

          >

            {user ? (

              <ProfileEditForm user={user} onUpdated={() => void refreshUser()} />

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

          <SettingsSectionCard

            title="Sessões e dispositivos"

            description="Veja onde sua conta está conectada e encerre acessos."

            icon={MonitorSmartphone}

          >

            <SessionsPanel />

          </SettingsSectionCard>

        </PanelState>

      ) : null}



      {section === "billing" ? (

        <SettingsSectionCard

          title="Assinatura"

          description="Plano FitRadar SaaS — cobrança via Asaas (fora das lojas)."

          icon={CreditCard}

        >

          <CreatorSubscriptionPanel />

        </SettingsSectionCard>

      ) : null}



      {section === "notifications" ? (

        <div className="space-y-4">

          <PanelState state={settingsState} message={settingsError} onRetry={loadSettings}>

            <SettingsSectionCard

              title="Resumo por e-mail"

              description="Frequência do digest proativo do Radar (métricas do motor)."

              icon={Bell}

            >

              <fieldset className="space-y-2" disabled={savingDigest}>

                <legend className="sr-only">Frequência do digest</legend>

                {DIGEST_FREQUENCY_OPTIONS.map((opt) => (

                  <label

                    key={opt.value}

                    className={cn(

                      "flex cursor-pointer gap-3 rounded-[11px] border px-3.5 py-3 transition-colors",

                      digestFrequency === opt.value

                        ? "border-primary/40 bg-primary/5"

                        : "border-border bg-secondary/20 hover:bg-secondary/40",

                    )}

                  >

                    <input

                      type="radio"

                      name="digestFrequency"

                      value={opt.value}

                      checked={digestFrequency === opt.value}

                      onChange={() => void saveDigestFrequency(opt.value)}

                      className="mt-1 size-4 accent-primary"

                    />

                    <span>

                      <span className="block text-sm font-semibold">{opt.label}</span>

                      <span className="mt-0.5 block text-xs text-muted-foreground">

                        {opt.description}

                      </span>

                    </span>

                  </label>

                ))}

              </fieldset>

            </SettingsSectionCard>

          </PanelState>



          <PushSettingsCard />

        </div>

      ) : null}



      {section === "privacy" ? (

        <SettingsSectionCard

          title="Privacidade e dados"

          description="Termos, exportação LGPD e exclusão de conta."

          icon={Shield}

        >

          <AccountPrivacyPanel />

        </SettingsSectionCard>

      ) : null}



      {section === "space" ? (

        <SettingsSectionCard

          title="Meu espaço"

          description="Personalize marca, programas e convite de alunos."

          icon={Sparkles}

        >

          <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">

            Abra o Construtor do Espaço para editar nome, cores, programas e link de convite.

          </p>

          <div className="flex flex-wrap gap-2">

            <Button asChild className="gap-2">

              <Link to="/app/space">

                <ExternalLink className="size-4" aria-hidden />

                Abrir Construtor do Espaço

              </Link>

            </Button>

            <Button type="button" variant="outline" className="gap-2" onClick={() => void logout()}>

              <LogOut className="size-4" aria-hidden />

              Sair

            </Button>

          </div>

        </SettingsSectionCard>

      ) : null}

    </div>

  );

}


