import { API_PREFIX } from "@/lib/auth/constants";
import { api, apiUpload } from "@/lib/api/client";
import type { CreatorSpaceRequest, CreatorSpaceResponse, LogoUploadResponse } from "@/lib/api/domain-types";

export const spaceApi = {
  get: () => api.get<CreatorSpaceResponse>(`${API_PREFIX}/creator-space`),

  update: (body: CreatorSpaceRequest) =>
    api.put<CreatorSpaceResponse>(`${API_PREFIX}/creator-space`, body),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<LogoUploadResponse>(`${API_PREFIX}/creator-space/logo`, formData);
  },
};
