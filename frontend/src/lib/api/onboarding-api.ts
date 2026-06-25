import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type { OnboardingStatusResponse } from "@/lib/api/domain-types";

export const onboardingApi = {
  status: () => api.get<OnboardingStatusResponse>(`${API_PREFIX}/onboarding/status`),

  seedDemo: () => api.post<OnboardingStatusResponse>(`${API_PREFIX}/onboarding/demo-seed`),
};
