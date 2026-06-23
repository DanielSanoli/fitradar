import type { FitnessIconContext } from "@/lib/icons/fitness-icons";

export type WorkoutVisualKind = "strength" | "cardio" | "nutrition";

/** Heuristic icon kind from text fields already stored in the API (no new backend fields). */
export function detectWorkoutVisualKind(
  title: string,
  description?: string | null,
  markdown?: string | null,
): WorkoutVisualKind {
  const text = `${title} ${description ?? ""} ${markdown ?? ""}`.toLowerCase();
  if (/nutri|refei|aliment|prote[ií]n|dieta|salad|macro|calor|hidrata/.test(text)) {
    return "nutrition";
  }
  if (/cardio|corrida|caminh|hiit|aer[oó]|mobil|along|yoga|passos|footprint|aquec/.test(text)) {
    return "cardio";
  }
  return "strength";
}

export function workoutVisualIcon(kind: WorkoutVisualKind): FitnessIconContext {
  switch (kind) {
    case "nutrition":
      return "healthy";
    case "cardio":
      return "activity";
    default:
      return "workout";
  }
}
