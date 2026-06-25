import type { DigestFrequency } from "@/lib/api/user-settings-api";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/api/types";

export const DIGEST_FREQUENCY_OPTIONS: {
  value: DigestFrequency;
  label: string;
  description: string;
}[] = [
  {
    value: "WEEKLY",
    label: "Semanal",
    description: "Resumo toda segunda-feira com métricas da comunidade.",
  },
  {
    value: "DAILY",
    label: "Diário",
    description: "Resumo diário com os mesmos sinais do Radar.",
  },
  {
    value: "NONE",
    label: "Nenhum",
    description: "Sem e-mails de resumo — você consulta no painel.",
  },
];

export function planLabel(plan: SubscriptionPlan): string {
  return plan === "PRO" ? "Pro" : "Grátis";
}

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "TRIALING":
      return "Em trial";
    case "ACTIVE":
      return "Ativa";
    case "PAST_DUE":
      return "Pagamento pendente";
    case "CANCELED":
      return "Cancelada";
  }
}

export type SettingsSection = "account" | "billing" | "notifications" | "privacy" | "space";

export const SETTINGS_SECTIONS: {
  id: SettingsSection;
  label: string;
}[] = [
  { id: "account", label: "Conta" },
  { id: "billing", label: "Assinatura" },
  { id: "notifications", label: "Notificações" },
  { id: "privacy", label: "Privacidade" },
  { id: "space", label: "Meu espaço" },
];
