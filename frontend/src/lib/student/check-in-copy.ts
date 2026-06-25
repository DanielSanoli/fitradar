import type { CheckInStatus } from "@/lib/api/domain-types";

export const FEELING_LABELS = ["Esgotante", "Pesado", "Normal", "Bem", "Ótimo!"] as const;

export function feelingLabel(feeling: number | null | undefined): string | null {
  if (feeling == null || feeling < 1 || feeling > 5) return null;
  return FEELING_LABELS[feeling - 1] ?? null;
}

export function checkInStatusLabel(status: CheckInStatus): string {
  return status === "DONE" ? "Concluído" : "Pulado";
}

export function formatCheckInDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
