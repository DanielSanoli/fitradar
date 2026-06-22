import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type {
  ChurnRiskResult,
  CreatorOverviewResult,
  RiskLevel,
  StudentProgressResult,
} from "@/lib/api/domain-types";

export const retentionApi = {
  overview: () => api.get<CreatorOverviewResult>(`${API_PREFIX}/retention/overview`),

  studentsAtRisk: (minLevel: RiskLevel = "MEDIUM") =>
    api.get<ChurnRiskResult[]>(
      `${API_PREFIX}/retention/students-at-risk?minLevel=${minLevel}`,
    ),

  studentRisk: (studentId: string) =>
    api.get<ChurnRiskResult>(`${API_PREFIX}/retention/students/${studentId}/risk`),

  studentProgress: (studentId: string) =>
    api.get<StudentProgressResult>(`${API_PREFIX}/retention/students/${studentId}/progress`),
};
