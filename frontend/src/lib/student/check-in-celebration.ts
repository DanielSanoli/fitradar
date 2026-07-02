/** Mensagens determinísticas pós check-in — regras fixas, sem IA. */

export type CheckInCelebrationContext = {
  currentStreak: number;
  longestStreak: number;
  totalCheckInsDone: number;
  weeklyDone: number;
  shieldEarned?: boolean;
  shieldConsumed?: boolean;
  before: {
    streak: number;
    longestStreak: number;
    weeklyDone: number;
    totalCheckInsDone: number;
  };
};

export type CheckInCelebrationCopy = {
  headline: string;
  subtitle: string;
  variant:
    | "milestone"
    | "shield-earned"
    | "shield-consumed"
    | "record"
    | "streak-five"
    | "week-start"
    | "default";
};

const TOTAL_MILESTONES = [100, 50, 10] as const;

export function resolveCheckInCelebrationMessage(
  ctx: CheckInCelebrationContext,
): CheckInCelebrationCopy {
  for (const milestone of TOTAL_MILESTONES) {
    if (
      ctx.totalCheckInsDone === milestone
      && ctx.before.totalCheckInsDone < milestone
    ) {
      return {
        headline: `${milestone}º treino registrado!`,
        subtitle: "Marco histórico na sua jornada.",
        variant: "milestone",
      };
    }
  }

  if (ctx.shieldEarned) {
    return {
      headline: "Você ganhou um escudo!",
      subtitle: "Protege 1 dia perdido na sequência (máx. 2 escudos).",
      variant: "shield-earned",
    };
  }

  if (ctx.shieldConsumed) {
    return {
      headline: "Escudo usado — sequência salva!",
      subtitle: `${ctx.currentStreak} dias seguidos mantidos.`,
      variant: "shield-consumed",
    };
  }

  const newRecord =
    ctx.longestStreak > ctx.before.longestStreak
    && ctx.currentStreak === ctx.longestStreak
    && ctx.currentStreak > 0;

  if (newRecord) {
    return {
      headline: `Novo recorde: ${ctx.currentStreak} dias!`,
      subtitle: "Sua maior sequência até aqui.",
      variant: "record",
    };
  }

  if (ctx.currentStreak >= 5 && ctx.currentStreak % 5 === 0) {
    return {
      headline: `${ctx.currentStreak} dias seguidos!`,
      subtitle: "Sequência múltipla de 5 — continue firme.",
      variant: "streak-five",
    };
  }

  if (ctx.weeklyDone === 1 && ctx.before.weeklyDone === 0) {
    return {
      headline: "Primeiro treino da semana!",
      subtitle: "Semana começando com o pé direito.",
      variant: "week-start",
    };
  }

  return {
    headline: "Treino registrado!",
    subtitle: defaultSubtitle(ctx.currentStreak),
    variant: "default",
  };
}

function defaultSubtitle(streak: number): string {
  if (streak >= 21) return "Você está imparável.";
  if (streak >= 14) return "Duas semanas — incrível.";
  if (streak >= 7) return "Uma semana cheia. Siga assim.";
  if (streak >= 3) return "O hábito está se formando.";
  return "Bom trabalho. Cada treino conta.";
}

/** Vibração curta quando suportado — falha silenciosa. */
export function triggerCheckInHaptic(): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([35, 40, 35]);
    } catch {
      // ignore unsupported
    }
  }
}
