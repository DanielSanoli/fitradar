import type { AlertSeverity, AlertType } from "@/lib/api/domain-types";

export function alertTypeLabel(type: AlertType): string {
  switch (type) {
    case "STUDENT_INACTIVE":
      return "Aluno inativo";
    case "CHURN_RISK_HIGH":
      return "Risco de churn";
    case "ADHERENCE_DROP":
      return "Queda de aderência";
    case "POSITIVE_STREAK":
      return "Sequência positiva";
  }
}

export function alertSeverityLabel(severity: AlertSeverity): string {
  switch (severity) {
    case "CRITICAL":
      return "Crítico";
    case "WARNING":
      return "Atenção";
    case "INFO":
      return "Info";
  }
}

export function alertSeverityClass(severity: AlertSeverity): string {
  switch (severity) {
    case "CRITICAL":
      return "border-[hsl(var(--risk-high)/0.35)] bg-[hsl(var(--risk-high)/0.12)] text-[hsl(0_82%_80%)]";
    case "WARNING":
      return "border-amber-500/35 bg-amber-500/10 text-amber-300";
    case "INFO":
      return "border-primary/30 bg-primary/10 text-primary";
  }
}

export function formatAlertTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays <= 0) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
