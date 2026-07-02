/** Tipos alinhados aos DTOs Java — regenere com `npm run openapi:generate` quando o backend estiver no ar. */

export type UserRole = "CREATOR" | "STUDENT" | "ADMIN";
export type SubscriptionPlan = "FREE" | "PRO";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  creatorId: string | null;
  plan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  emailVerified: boolean;
  accessAllowed: boolean;
  hasProFeatures?: boolean;
  accessMessage: string | null;
  trialDaysRemaining: number;
  /** true após convite com senha temporária — exige troca antes de continuar. */
  mustChangePassword?: boolean;
  /** false até aceitar Termos de Uso / Privacidade no cadastro ou onboarding. */
  termsAccepted?: boolean;
  /** false até o aluno preencher a anamnese (somente STUDENT). */
  anamneseCompleted?: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}


export interface UserSession {
  id: string;
  deviceLabel: string;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly data: ApiErrorBody | null;

  constructor(status: number, message: string, data: ApiErrorBody | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type PaymentRequiredHandler = (message: string) => void;
export type UnauthorizedHandler = () => void;
