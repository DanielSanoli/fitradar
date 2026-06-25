import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type { CopilotAskRequest, CopilotAskResponse, NudgeSuggestion, SendNudgeResponse } from "@/lib/api/domain-types";

export const copilotApi = {
  ask: (body: CopilotAskRequest) =>
    api.post<CopilotAskResponse>(`${API_PREFIX}/copilot/ask`, body),

  nudge: (studentId: string) =>
    api.post<NudgeSuggestion>(`${API_PREFIX}/copilot/nudge/${studentId}`),

  sendNudge: (studentId: string, message: string) =>
    api.post<SendNudgeResponse>(`${API_PREFIX}/copilot/nudge/${studentId}/send`, { message }),
};
