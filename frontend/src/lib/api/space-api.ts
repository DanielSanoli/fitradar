import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type { CreatorSpaceRequest, CreatorSpaceResponse } from "@/lib/api/domain-types";

export const spaceApi = {
  get: () => api.get<CreatorSpaceResponse>(`${API_PREFIX}/creator-space`),

  update: (body: CreatorSpaceRequest) =>
    api.put<CreatorSpaceResponse>(`${API_PREFIX}/creator-space`, body),
};
