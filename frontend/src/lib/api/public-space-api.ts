import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type { CreatorSpaceResponse } from "@/lib/api/domain-types";

export const publicSpaceApi = {
  getBySlug: (slug: string) =>
    api.get<CreatorSpaceResponse>(`${API_PREFIX}/public/spaces/${encodeURIComponent(slug)}`),
};
