import type { LucideIcon } from "lucide-react";
import { CalendarCheck, Target } from "lucide-react";

export type StudentNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

/** Single source of truth — bottom nav and sidebar must iterate this list. */
export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  { to: "/student", label: "Início", icon: CalendarCheck, end: true },
  { to: "/student/progress", label: "Progresso", icon: Target },
];
