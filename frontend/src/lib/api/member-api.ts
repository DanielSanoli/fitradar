import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type {
  CheckInRequest,
  CheckInResponse,
  CreatorSpaceResponse,
  GamificationProfileResponse,
  PageResponse,
  ProgramCheckoutResponse,
  StudentProgramResponse,
  StudentProgressResult,
  WorkoutResponse,
} from "@/lib/api/domain-types";

export const memberApi = {
  myProgress: () => api.get<StudentProgressResult>(`${API_PREFIX}/my/progress`),

  myGamification: () => api.get<GamificationProfileResponse>(`${API_PREFIX}/my/gamification`),

  myPrograms: () => api.get<StudentProgramResponse[]>(`${API_PREFIX}/my/programs`),

  enrollProgram: (programId: string) =>
    api.post<void>(`${API_PREFIX}/my/programs/${programId}/enroll`),

  checkoutProgram: (programId: string) =>
    api.post<ProgramCheckoutResponse>(`${API_PREFIX}/my/programs/${programId}/checkout`),

  myWorkouts: () => api.get<WorkoutResponse[]>(`${API_PREFIX}/my/workouts`),

  myCheckIns: (page = 0, size = 100) =>
    api.get<PageResponse<CheckInResponse>>(
      `${API_PREFIX}/my/check-ins?page=${page}&size=${size}`,
    ),

  createCheckIn: (body: CheckInRequest) =>
    api.post<CheckInResponse>(`${API_PREFIX}/my/check-ins`, body),

  mySpace: () => api.get<CreatorSpaceResponse>(`${API_PREFIX}/my/space`),
};
