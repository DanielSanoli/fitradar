import type { LucideIcon } from "lucide-react";
import { CalendarCheck, ClipboardList, Settings, Target } from "lucide-react";

export type StudentNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

/** Single source of truth — bottom nav and sidebar must iterate this list. */
export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  { to: "/student", label: "Início", icon: CalendarCheck, end: true },
  { to: "/student/programs", label: "Programas", icon: ClipboardList },
  { to: "/student/progress", label: "Progresso", icon: Target },
  { to: "/student/settings", label: "Perfil", icon: Settings },
];
