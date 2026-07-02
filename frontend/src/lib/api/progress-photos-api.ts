import { API_PREFIX } from "@/lib/auth/constants";
import { api, apiFetchBlob, apiUpload } from "@/lib/api/client";
import type {
  ProgressPhotoConsentResponse,
  ProgressPhotoResponse,
} from "@/lib/api/domain-types";

export const progressPhotosApi = {
  consentStatus: () =>
    api.get<ProgressPhotoConsentResponse>(`${API_PREFIX}/my/progress-photos/consent`),

  grantConsent: () =>
    api.post<ProgressPhotoConsentResponse>(`${API_PREFIX}/my/progress-photos/consent`, {
      consentProgressPhotos: true,
    }),

  listMine: () => api.get<ProgressPhotoResponse[]>(`${API_PREFIX}/my/progress-photos`),

  upload: (formData: FormData) =>
    apiUpload<ProgressPhotoResponse>(`${API_PREFIX}/my/progress-photos`, formData),

  delete: (id: string) => api.delete<void>(`${API_PREFIX}/my/progress-photos/${id}`),

  updateSharing: (id: string, sharedWithCoach: boolean) =>
    api.patch<ProgressPhotoResponse>(`${API_PREFIX}/my/progress-photos/${id}/sharing`, {
      sharedWithCoach,
    }),

  fetchContentBlob: (id: string) =>
    apiFetchBlob(`${API_PREFIX}/my/progress-photos/${id}/content`),

  listSharedForStudent: (studentId: string) =>
    api.get<ProgressPhotoResponse[]>(`${API_PREFIX}/students/${studentId}/progress-photos`),

  fetchSharedContentBlob: (studentId: string, photoId: string) =>
    apiFetchBlob(`${API_PREFIX}/students/${studentId}/progress-photos/${photoId}/content`),
};
