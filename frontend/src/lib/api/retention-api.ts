import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type {
  AlertResponse,
  ChurnRiskResult,
  CreatorAdherenceTrendResult,
  CreatorOverviewResult,
  CreatorRankingResult,
  PageResponse,
  RankingMetric,
  RankingPeriod,
  RiskLevel,
  StudentProgressResult,
} from "@/lib/api/domain-types";

export type RetentionAlertsParams = {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
};

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

  alerts: ({ unreadOnly = false, page = 0, size = 20 }: RetentionAlertsParams = {}) => {
    const params = new URLSearchParams({
      unreadOnly: String(unreadOnly),
      page: String(page),
      size: String(size),
    });
    return api.get<PageResponse<AlertResponse>>(`${API_PREFIX}/retention/alerts?${params}`);
  },

  markAlertRead: (alertId: string) =>
    api.post<AlertResponse>(`${API_PREFIX}/retention/alerts/${alertId}/read`),
};
