import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Apple,
  CalendarCheck,
  Dumbbell,
  Flame,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Radar,
  Salad,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

/** Contextual fitness icons — import named icons only (tree-shaking friendly). */
export type FitnessIconContext =
  | "workout"
  | "activity"
  | "streak"
  | "adherence"
  | "nutrition"
  | "ranking"
  | "goal"
  | "checkIn"
  | "students"
  | "programs"
  | "retention"
  | "radar"
  | "space"
  | "healthy"
  | "overview"
  | "invite";

export const fitnessIconMap: Record<FitnessIconContext, LucideIcon> = {
  workout: Dumbbell,
  activity: Activity,
  streak: Flame,
  adherence: HeartPulse,
  nutrition: Apple,
  ranking: Trophy,
  goal: Target,
  checkIn: CalendarCheck,
  students: Users,
  programs: Dumbbell,
  retention: HeartPulse,
  radar: Radar,
  space: Sparkles,
  healthy: Salad,
  overview: LayoutDashboard,
  invite: UserPlus,
};

export { MessageSquare };
