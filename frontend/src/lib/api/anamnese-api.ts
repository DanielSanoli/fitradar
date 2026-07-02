import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type { AnamneseRequest, AnamneseResponse } from "@/lib/api/domain-types";

export const anamneseApi = {
  create: (body: AnamneseRequest) =>
    api.post<AnamneseResponse>(`${API_PREFIX}/anamnese`, body),

  mine: () => api.get<AnamneseResponse>(`${API_PREFIX}/anamnese/me`),

  forStudent: (studentId: string) =>
    api.get<AnamneseResponse>(`${API_PREFIX}/anamnese/student/${studentId}`),
};
