import type { StudentProgramResponse } from "@/lib/api/domain-types";

/** Display label for program price — value comes from API DTO, not calculated here. */
export function programPriceLabel(program: StudentProgramResponse): string {
  if (!program.paid) return "Grátis";
  if (program.price == null || program.price === "") return "Pago";
  const parsed = parseFloat(program.price);
  if (!Number.isFinite(parsed)) return "Pago";
  return parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function canEnrollFree(program: StudentProgramResponse): boolean {
  return !program.paid && !program.enrolled && !program.purchasePending;
}

export function canPurchasePaid(program: StudentProgramResponse): boolean {
  return program.paid && !program.enrolled && !program.purchasePending;
}
