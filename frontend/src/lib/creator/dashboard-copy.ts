export type DashboardAttentionState = "empty" | "positive" | "alerts";

export function formatDashboardDate(date = new Date()): string {
  const raw = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function dashboardGreeting(firstName: string, state: DashboardAttentionState): string {
  switch (state) {
    case "empty":
      return `Oi, ${firstName}! Assim que seus alunos começarem a treinar, eu aviso quem precisa de atenção. Por enquanto, posso te explicar como tudo funciona.`;
    case "positive":
      return `Semana redonda, ${firstName}! Ninguém no vermelho. Que tal usar esse momento para reconhecer quem está se dedicando?`;
    default:
      return `Oi, ${firstName}! Eu cruzo os sinais da sua comunidade e aponto onde agir primeiro. Toque numa sugestão para começar.`;
  }
}

export function dashboardSuggestions(state: DashboardAttentionState): string[] {
  if (state === "empty") {
    return [
      "Como o Radar detecta risco?",
      "O que é um check-in?",
      "Como convido alunos?",
    ];
  }
  return [
    "Quem vai desistir essa semana?",
    "Quem merece um parabéns?",
    "Como está a aderência geral?",
  ];
}

export function attentionSubtitle(state: DashboardAttentionState): string {
  switch (state) {
    case "empty":
      return "Ainda sem dados para monitorar.";
    case "positive":
      return "Comunidade saudável, nada exige ação agora.";
    default:
      return "Ordenado por gravidade — comece pelo topo.";
  }
}
