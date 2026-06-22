import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type { CopilotAskRequest, CopilotAskResponse, NudgeSuggestion } from "@/lib/api/domain-types";

export const copilotApi = {
  ask: (body: CopilotAskRequest) =>
    api.post<CopilotAskResponse>(`${API_PREFIX}/copilot/ask`, body),

  nudge: (studentId: string) =>
    api.post<NudgeSuggestion>(`${API_PREFIX}/copilot/nudge/${studentId}`),
};
