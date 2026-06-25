/** Labels for Asaas payment statuses returned in subscription invoices (display only). */
export function invoiceStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "RECEIVED":
    case "CONFIRMED":
      return "Paga";
    case "OVERDUE":
      return "Vencida";
    case "REFUNDED":
      return "Estornada";
    case "CANCELED":
      return "Cancelada";
    default:
      return status.replaceAll("_", " ").toLowerCase();
  }
}

export function invoiceStatusClass(status: string): string {
  switch (status) {
    case "RECEIVED":
    case "CONFIRMED":
      return "border-primary/30 bg-primary/10 text-primary";
    case "PENDING":
      return "border-amber-500/35 bg-amber-500/10 text-amber-300";
    case "OVERDUE":
      return "border-[hsl(var(--risk-high)/0.35)] bg-[hsl(var(--risk-high)/0.12)] text-[hsl(0_82%_80%)]";
    default:
      return "border-border bg-secondary/40 text-muted-foreground";
  }
}

export function formatBillingDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Exibe percentual de comissão vindo do backend (BigDecimal). */
export function formatFeePercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(parsed)) return "—";
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2).replace(/\.?0+$/, "");
}
