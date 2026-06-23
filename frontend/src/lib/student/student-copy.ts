/** Display copy derived from DTO counts — not retention metrics. */

export function streakSubtitle(streak: number, message: string | null): string {
  if (message?.trim()) return message;
  if (streak >= 21) return "Hábito formado. Continua assim.";
  if (streak >= 14) return "Duas semanas. Você é consistente.";
  if (streak >= 7) return "Uma semana inteira. Não pare agora.";
  if (streak >= 3) return "O hábito está se formando.";
  return "Cada treino conta.";
}

export function celebrationMessage(streak: number): string {
  if (streak >= 21) return "Você está imparável.";
  if (streak >= 14) return "Duas semanas — incrível.";
  if (streak >= 7) return "Uma semana cheia. Siga assim.";
  return "Bom trabalho. Cada treino conta.";
}

export function adherenceLabelFromDto(adherence: string | null): string {
  if (adherence == null || adherence === "") return "Em construção";
  const parsed = parseFloat(adherence);
  if (!Number.isFinite(parsed)) return "Em construção";
  if (parsed >= 90) return "Excelente";
  if (parsed >= 75) return "Muito boa";
  if (parsed >= 60) return "Boa";
  if (parsed >= 40) return "Regular";
  return "Em construção";
}

export function adherenceRingColor(adherence: string | null): string {
  if (adherence == null || adherence === "") return "hsl(var(--muted-foreground))";
  const parsed = parseFloat(adherence);
  if (!Number.isFinite(parsed)) return "hsl(var(--muted-foreground))";
  if (parsed >= 80) return "hsl(var(--primary))";
  if (parsed >= 60) return "hsl(38 96% 56%)";
  return "hsl(var(--destructive))";
}

export function isEarlyJourney(
  totalCheckInsDone: number | null | undefined,
  adherence: string | null,
): boolean {
  if (adherence == null || adherence === "") return true;
  if (totalCheckInsDone == null) return false;
  return totalCheckInsDone < 5;
}
