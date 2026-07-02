import { API_PREFIX } from "@/lib/auth/constants";
import { api } from "@/lib/api/client";
import type {
  EnrollmentRequest,
  EnrollmentResponse,
  PageResponse,
  StudentInviteRequest,
  StudentInviteResponse,
  StudentResendInviteResponse,
  StudentResponse,
} from "@/lib/api/domain-types";

export const studentsApi = {
  list: (page = 0, size = 50) =>
    api.get<PageResponse<StudentResponse>>(`${API_PREFIX}/students?page=${page}&size=${size}`),

  get: (id: string) => api.get<StudentResponse>(`${API_PREFIX}/students/${id}`),

  invite: (body: StudentInviteRequest) =>
    api.post<StudentInviteResponse>(`${API_PREFIX}/students`, body),

  resendInvite: (studentId: string) =>
    api.post<StudentResendInviteResponse>(`${API_PREFIX}/students/${studentId}/resend-invite`),

  enrollments: (studentId: string) =>
    api.get<EnrollmentResponse[]>(`${API_PREFIX}/students/${studentId}/enrollments`),

  enroll: (studentId: string, body: EnrollmentRequest) =>
    api.post<EnrollmentResponse>(`${API_PREFIX}/students/${studentId}/enrollments`, body),

  unenroll: (studentId: string, enrollmentId: string) =>
    api.delete<void>(`${API_PREFIX}/students/${studentId}/enrollments/${enrollmentId}`),
};
