import type { LucideIcon } from "lucide-react";
import {
  Award,
  CreditCard,
  LayoutTemplate,
  Radar,
  Salad,
  Trophy,
} from "lucide-react";

export const LANDING_PRO_PRICE = "R$ 49,90/mês";
export const LANDING_TRIAL_DAYS = 14;

export const COMPARE_ROWS = [
  {
    legacy: "Planilha + WhatsApp para lembrar aluno",
    fitradar: "Radar monitora sinais e prioriza quem precisa de atenção",
  },
  {
    legacy: "Achismo sobre quem vai desistir",
    fitradar: "Risco de churn calculado pelo motor — a IA só interpreta",
  },
  {
    legacy: "Área genérica sem a sua marca",
    fitradar: "Espaço white-label com logo, cores e link do seu studio",
  },
  {
    legacy: "Cobrança manual e esquecida",
    fitradar: "Assinaturas e programas pagos via Asaas, no web",
  },
] as const;

export type LandingFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: Radar,
    title: "Radar de retenção",
    description: "Prevê quem está em risco e sugere o nudge certo — antes do cancelamento silencioso.",
  },
  {
    icon: LayoutTemplate,
    title: "Área de membros white-label",
    description: "Seu nome, suas cores e seu link — o aluno treina no seu universo.",
  },
  {
    icon: Trophy,
    title: "Treinos e programas",
    description: "Publique periodizações, acompanhe check-ins e streaks em tempo real.",
  },
  {
    icon: Salad,
    title: "Nutrição",
    description: "Planos alimentares no mesmo fluxo — ideal para coaches e nutricionistas.",
  },
  {
    icon: Award,
    title: "Gamificação e ranking",
    description: "Ranking de engajamento para celebrar quem aparece e puxar quem sumiu.",
  },
  {
    icon: CreditCard,
    title: "Cobrança recorrente",
    description: "Receba dos alunos com split Asaas — sem comissão de app store.",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Monte seu espaço",
    description: "Defina marca, slug e nicho. Seu link público fica pronto em minutos.",
  },
  {
    step: "2",
    title: "Convide alunos",
    description: "Convites com senha temporária, anamnese e PWA instalável no celular.",
  },
  {
    step: "3",
    title: "O Radar cuida da retenção",
    description: "Alertas, lembretes sugeridos e visão 360º de quem precisa de você hoje.",
  },
] as const;

export const LANDING_FAQ = [
  {
    question: "O que é o FitRadar?",
    answer:
      "Plataforma white-label para coaches e nutricionistas: área de membros + motor de retenção que sinaliza risco de churn e sugere ações — não é só um portal de treinos.",
  },
  {
    question: "Preciso de cartão para começar?",
    answer: `Não. Você testa ${LANDING_TRIAL_DAYS} dias grátis sem cartão. Assine o Pro só quando fizer sentido.`,
  },
  {
    question: "Como recebo dos meus alunos?",
    answer:
      "Conecte sua conta Asaas e venda programas pagos com split automático. Cobrança digital no web — fora das lojas de apps.",
  },
  {
    question: "Funciona no celular?",
    answer:
      "Sim. O aluno acessa via PWA em /student: check-in, treinos e notificações sem baixar app store.",
  },
  {
    question: "A IA inventa números de aderência?",
    answer:
      "Não. Métricas vêm do motor determinístico; o copiloto interpreta os sinais e sugere mensagens — nunca calcula percentuais.",
  },
  {
    question: "Serve para nutricionistas?",
    answer:
      "Sim. Há vocabulário e fluxos para planos alimentares, além de treinos — um espaço para acompanhar aderência e retenção.",
  },
] as const;
