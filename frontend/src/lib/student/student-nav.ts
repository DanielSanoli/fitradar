import type { LucideIcon } from "lucide-react";
import { CalendarCheck, Settings, Target } from "lucide-react";
import { getSpaceVocabulary, type SpaceVocabulary } from "@/lib/space/vocabulary";

export type StudentNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export function getStudentNavItems(vocabulary: SpaceVocabulary): StudentNavItem[] {
  return [
    { to: "/student", label: "Início", icon: CalendarCheck, end: true },
    { to: "/student/programs", label: vocabulary.programsNav, icon: vocabulary.programIcon },
    { to: "/student/progress", label: "Progresso", icon: Target },
    { to: "/student/settings", label: "Perfil", icon: Settings },
  ];
}

/** Fitness default — prefer getStudentNavItems with live vocabulary in layouts. */
export const STUDENT_NAV_ITEMS: StudentNavItem[] = getStudentNavItems(getSpaceVocabulary("GYM"));
