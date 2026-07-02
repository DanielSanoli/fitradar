import type {
  ExperienciaTreino,
  NivelAtividadeRotina,
  ObjetivoPrincipal,
} from "@/lib/api/domain-types";

export const objetivoPrincipalOptions: { value: ObjetivoPrincipal; label: string }[] = [
  { value: "EMAGRECIMENTO", label: "Emagrecimento" },
  { value: "HIPERTROFIA", label: "Hipertrofia / ganho de massa" },
  { value: "CONDICIONAMENTO", label: "Condicionamento físico" },
  { value: "SAUDE", label: "Saúde e bem-estar" },
  { value: "PERFORMANCE", label: "Performance esportiva" },
];

export const experienciaTreinoOptions: { value: ExperienciaTreino; label: string }[] = [
  { value: "INICIANTE", label: "Iniciante" },
  { value: "INTERMEDIARIO", label: "Intermediário" },
  { value: "AVANCADO", label: "Avançado" },
];

export const nivelAtividadeOptions: { value: NivelAtividadeRotina; label: string }[] = [
  { value: "SEDENTARIO", label: "Sedentário" },
  { value: "LEVE", label: "Levemente ativo" },
  { value: "MODERADO", label: "Moderadamente ativo" },
  { value: "ATIVO", label: "Muito ativo" },
];

export function labelObjetivoPrincipal(value: ObjetivoPrincipal): string {
  return objetivoPrincipalOptions.find((o) => o.value === value)?.label ?? value;
}

export function labelExperienciaTreino(value: ExperienciaTreino): string {
  return experienciaTreinoOptions.find((o) => o.value === value)?.label ?? value;
}

export function labelNivelAtividade(value: NivelAtividadeRotina): string {
  return nivelAtividadeOptions.find((o) => o.value === value)?.label ?? value;
}
