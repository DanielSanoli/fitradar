import { api } from "@/lib/api/client";
import { API_PREFIX } from "@/lib/auth/constants";

export type DigestFrequency = "WEEKLY" | "DAILY" | "NONE";

export type UserSettingsResponse = {
  userId: string;
  digestFrequency: DigestFrequency;
};

export type UserSettingsUpdateRequest = {
  digestFrequency: DigestFrequency;
};

export const userSettingsApi = {
  get: () => api.get<UserSettingsResponse>(`${API_PREFIX}/user-settings`),
  update: (body: UserSettingsUpdateRequest) =>
    api.patch<UserSettingsResponse>(`${API_PREFIX}/user-settings`, body),
};
