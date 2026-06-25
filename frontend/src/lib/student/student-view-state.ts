import type { StudentProgressResult } from "@/lib/api/domain-types";
import { isEarlyJourney } from "@/lib/student/student-copy";

export type StudentHomeViewMode = "workout" | "rest" | "none";
export type StudentProgressViewMode = "active" | "early";

export function deriveHomeViewMode(progress: StudentProgressResult | null): StudentHomeViewMode {
  if (!progress?.enrolled) return "none";
  if (progress.nextWorkoutTitle) return "workout";
  return "rest";
}

export function deriveProgressViewMode(
  totalCheckInsDone: number | null | undefined,
  adherence: string | null,
): StudentProgressViewMode {
  return isEarlyJourney(totalCheckInsDone, adherence) ? "early" : "active";
}
