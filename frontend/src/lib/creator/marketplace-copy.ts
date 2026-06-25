import type { PurchaseStatus } from "@/lib/api/domain-types";

/** Formats monetary values from API DTO strings for display only. */
export function formatMoneyBrl(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return "—";
  return parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function purchaseStatusLabel(status: PurchaseStatus): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "CONFIRMED":
      return "Confirmada";
    case "CANCELED":
      return "Cancelada";
    case "FAILED":
      return "Falhou";
  }
}

export function purchaseStatusClass(status: PurchaseStatus): string {
  switch (status) {
    case "CONFIRMED":
      return "border-primary/30 bg-primary/10 text-primary";
    case "PENDING":
      return "border-amber-500/35 bg-amber-500/10 text-amber-300";
    case "CANCELED":
    case "FAILED":
      return "border-[hsl(var(--risk-high)/0.35)] bg-[hsl(var(--risk-high)/0.12)] text-[hsl(0_82%_80%)]";
  }
}

export function maskWalletId(walletId: string | null | undefined): string {
  if (!walletId?.trim()) return "—";
  const trimmed = walletId.trim();
  if (trimmed.length <= 8) return trimmed;
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
