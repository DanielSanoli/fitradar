import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type {
  ProgramRequest,
  ProgramResponse,
  WorkoutRequest,
  WorkoutResponse,
} from "@/lib/api/domain-types";

export const programsApi = {
  list: () => api.get<ProgramResponse[]>(`${API_PREFIX}/programs`),

  get: (id: string) => api.get<ProgramResponse>(`${API_PREFIX}/programs/${id}`),

  create: (body: ProgramRequest) => api.post<ProgramResponse>(`${API_PREFIX}/programs`, body),

  update: (id: string, body: ProgramRequest) =>
    api.put<ProgramResponse>(`${API_PREFIX}/programs/${id}`, body),

  remove: (id: string) => api.delete<void>(`${API_PREFIX}/programs/${id}`),

  workouts: (programId: string) =>
    api.get<WorkoutResponse[]>(`${API_PREFIX}/programs/${programId}/workouts`),

  createWorkout: (programId: string, body: WorkoutRequest) =>
    api.post<WorkoutResponse>(`${API_PREFIX}/programs/${programId}/workouts`, body),

  updateWorkout: (programId: string, workoutId: string, body: WorkoutRequest) =>
    api.put<WorkoutResponse>(`${API_PREFIX}/programs/${programId}/workouts/${workoutId}`, body),

  removeWorkout: (programId: string, workoutId: string) =>
    api.delete<void>(`${API_PREFIX}/programs/${programId}/workouts/${workoutId}`),
};
