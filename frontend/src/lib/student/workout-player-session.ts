import type { WorkoutResponse } from "@/lib/api/domain-types";

const SESSION_PREFIX = "fitradar-workout-session:";
const OFFLINE_CACHE_KEY = "fitradar-workout-offline-cache";

export type WorkoutPlayerSession = {
  workoutId: string;
  workoutTitle: string;
  contentMarkdown: string;
  startedAt: string;
  currentItemIndex: number;
  completedItemIds: string[];
};

export function sessionStorageKey(workoutId: string): string {
  return `${SESSION_PREFIX}${workoutId}`;
}

export function loadWorkoutSession(workoutId: string): WorkoutPlayerSession | null {
  try {
    const raw = sessionStorage.getItem(sessionStorageKey(workoutId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkoutPlayerSession;
    if (parsed.workoutId !== workoutId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveWorkoutSession(session: WorkoutPlayerSession): void {
  try {
    sessionStorage.setItem(sessionStorageKey(session.workoutId), JSON.stringify(session));
  } catch {
    // quota exceeded — sessão continua em memória
  }
}

export function clearWorkoutSession(workoutId: string): void {
  try {
    sessionStorage.removeItem(sessionStorageKey(workoutId));
  } catch {
    // ignore
  }
}

export function createWorkoutSession(workout: Pick<WorkoutResponse, "id" | "title" | "contentMarkdown">): WorkoutPlayerSession {
  return {
    workoutId: workout.id,
    workoutTitle: workout.title,
    contentMarkdown: workout.contentMarkdown ?? "",
    startedAt: new Date().toISOString(),
    currentItemIndex: 0,
    completedItemIds: [],
  };
}

type OfflineWorkoutCache = Record<string, Pick<WorkoutResponse, "id" | "title" | "contentMarkdown">>;

export function cacheWorkoutsForOffline(workouts: WorkoutResponse[]): void {
  try {
    const map: OfflineWorkoutCache = {};
    for (const w of workouts) {
      map[w.id] = { id: w.id, title: w.title, contentMarkdown: w.contentMarkdown };
    }
    sessionStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getCachedWorkout(workoutId: string): Pick<WorkoutResponse, "id" | "title" | "contentMarkdown"> | null {
  try {
    const raw = sessionStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as OfflineWorkoutCache;
    return map[workoutId] ?? null;
  } catch {
    return null;
  }
}
