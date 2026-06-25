import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type { LeaderboardEntryResponse } from "@/lib/api/domain-types";

export type { LeaderboardEntryResponse };

export const gamificationApi = {
  leaderboard: (limit = 50) =>
    api.get<LeaderboardEntryResponse[]>(`${API_PREFIX}/gamification/leaderboard?limit=${limit}`),
};
