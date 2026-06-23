import type { User } from "@/lib/api/types";

export type RadarCopilotRole = "creator" | "student";

export type RadarCopilotConfig = {
  title: string;
  subtitle: string;
  greeting: (firstName: string) => string;
  suggestions: string[];
};

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

export const CREATOR_RADAR_CONFIG: RadarCopilotConfig = {
  title: "Pergunte ao Radar",
  subtitle: "Copiloto de retenção · lê os sinais da sua comunidade",
  greeting: (name) =>
    `Oi, ${firstName(name)}! Eu cruzo os sinais da sua comunidade e aponto onde agir primeiro. Toque numa sugestão para começar.`,
  suggestions: [
    "Quem vai desistir essa semana?",
    "Quem merece um parabéns?",
    "Como está a aderência geral?",
  ],
};

export const STUDENT_RADAR_CONFIG: RadarCopilotConfig = {
  title: "Como estou indo?",
  subtitle: "Seu progresso e streak · dados do motor de retenção",
  greeting: (name) =>
    `Oi, ${firstName(name)}! Pergunte sobre seu progresso, aderência ou streak.`,
  suggestions: ["Como estou indo?", "Qual meu streak?", "Como está minha aderência?"],
};

export function radarConfigForUser(user: User | null): RadarCopilotConfig {
  if (user?.role === "STUDENT") return STUDENT_RADAR_CONFIG;
  return CREATOR_RADAR_CONFIG;
}

export function radarCopilotRole(user: User | null): RadarCopilotRole {
  return user?.role === "STUDENT" ? "student" : "creator";
}
