import type { OnboardingStatusResponse } from "@/lib/api/domain-types";

export type OnboardingStepId = "space" | "program" | "student";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  to: string;
  actionLabel: string;
  done: (status: OnboardingStatusResponse) => boolean;
};

export const CREATOR_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "space",
    title: "Criar seu espaço",
    description: "Nome, visual e link público para seus alunos encontrarem você.",
    to: "/app/space",
    actionLabel: "Configurar espaço",
    done: (status) => status.hasSpace,
  },
  {
    id: "program",
    title: "Publicar o 1º programa",
    description: "Monte treinos e organize a rotina que seus alunos vão seguir.",
    to: "/app/programs/new",
    actionLabel: "Criar programa",
    done: (status) => status.hasProgram,
  },
  {
    id: "student",
    title: "Convidar primeiro aluno",
    description: "Envie o convite para alguém começar a treinar com você.",
    to: "/app/students",
    actionLabel: "Convidar aluno",
    done: (status) => status.hasStudent,
  },
];

export function onboardingProgressCount(status: OnboardingStatusResponse): number {
  return CREATOR_ONBOARDING_STEPS.filter((step) => step.done(status)).length;
}

export function nextOnboardingStep(status: OnboardingStatusResponse): OnboardingStep | null {
  return CREATOR_ONBOARDING_STEPS.find((step) => !step.done(status)) ?? null;
}
