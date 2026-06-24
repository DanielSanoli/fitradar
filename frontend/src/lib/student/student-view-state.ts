import type { StudentProgressResult } from "@/lib/api/domain-types";
import type { StudentHomeViewMode } from "@/components/student/StudentStatePreviewToggle";
import { isEarlyJourney } from "@/lib/student/student-copy";

export function deriveHomeViewMode(progress: StudentProgressResult | null): StudentHomeViewMode {
  if (!progress?.enrolled) return "none";
  if (progress.nextWorkoutTitle) return "workout";
  return "rest";
}

export function deriveProgressViewMode(
  totalCheckInsDone: number | null | undefined,
  adherence: string | null,
): "active" | "early" {
  return isEarlyJourney(totalCheckInsDone, adherence) ? "early" : "active";
}
