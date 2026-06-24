import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type {
  ChurnRiskResult,
  CreatorAdherenceTrendResult,
  CreatorOverviewResult,
  CreatorRankingResult,
  RankingMetric,
  RankingPeriod,
  RiskLevel,
  StudentProgressResult,
} from "@/lib/api/domain-types";

export const retentionApi = {
  overview: () => api.get<CreatorOverviewResult>(`${API_PREFIX}/retention/overview`),

  adherenceTrend: () =>
    api.get<CreatorAdherenceTrendResult>(`${API_PREFIX}/retention/adherence-trend`),

  ranking: (metric: RankingMetric = "ADHERENCE", period: RankingPeriod = "WEEK") =>
    api.get<CreatorRankingResult>(
      `${API_PREFIX}/retention/ranking?metric=${metric}&period=${period}`,
    ),

  studentsAtRisk: (minLevel: RiskLevel = "MEDIUM") =>
    api.get<ChurnRiskResult[]>(
      `${API_PREFIX}/retention/students-at-risk?minLevel=${minLevel}`,
    ),

  studentRisk: (studentId: string) =>
    api.get<ChurnRiskResult>(`${API_PREFIX}/retention/students/${studentId}/risk`),

  studentProgress: (studentId: string) =>
    api.get<StudentProgressResult>(`${API_PREFIX}/retention/students/${studentId}/progress`),
};
