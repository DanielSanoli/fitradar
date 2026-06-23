import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";

export type LeaderboardEntryResponse = {
  rank: number;
  studentId: string;
  studentName: string;
  currentStreak: number;
  totalCheckInsDone: number;
};

export const gamificationApi = {
  leaderboard: (limit = 50) =>
    api.get<LeaderboardEntryResponse[]>(`${API_PREFIX}/gamification/leaderboard?limit=${limit}`),
};
