/** Domain types aligned with Java DTOs — values come from the backend, never computed client-side. */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type AlertType =
  | "STUDENT_INACTIVE"
  | "CHURN_RISK_HIGH"
  | "ADHERENCE_DROP"
  | "POSITIVE_STREAK";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export type AlertResponse = {
  id: string;
  subjectStudentId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  actionSuggestion: string | null;
  dataSnapshot: string | null;
  createdAt: string;
  read: boolean;
};

export type UiRiskLevel = "baixo" | "medio" | "alto";

export type CheckInStatus = "DONE" | "SKIPPED";

export type CreatorOverviewResult = {
  activeStudents: number;
  avgAdherence: string | null;
  atRiskCount: number;
  checkInsThisWeek: number;
  newStudentsThisWeek: number;
  assumptions: string[];
};

export type AdherenceTrendPoint = {
  weekStart: string;
  avgAdherence: string | null;
};

export type CreatorAdherenceTrendResult = {
  currentPeriodAdherence: string | null;
  previousPeriodAdherence: string | null;
  changePoints: string | null;
  weeklySeries: AdherenceTrendPoint[];
  assumptions: string[];
};

export type RankingMetric = "ADHERENCE" | "STREAK";
export type RankingPeriod = "WEEK" | "MONTH";

export type CreatorRankingEntry = {
  rank: number;
  studentId: string;
  studentName: string;
  value: string | null;
};

export type CreatorRankingResult = {
  metric: RankingMetric;
  period: RankingPeriod;
  entries: CreatorRankingEntry[];
  assumptions: string[];
};

export type ChurnRiskResult = {
  studentId: string;
  studentName: string;
  score: number;
  level: RiskLevel;
  assumptions: string[];
};

export type StudentProgressResult = {
  studentId: string;
  studentName: string;
  enrolled: boolean;
  adherence: string | null;
  currentStreak: number;
  weeklyDone: number;
  nextWorkoutId: string | null;
  nextWorkoutTitle: string | null;
  message: string | null;
  assumptions: string[];
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type StudentResponse = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
};

export type StudentInviteRequest = {
  name: string;
  email: string;
};

export type StudentInviteResponse = {
  studentId: string;
  name: string;
  email: string;
  temporaryPassword: string;
};

export type EnrollmentResponse = {
  id: string;
  studentId: string;
  programId: string;
  programTitle: string;
  startDate: string | null;
  active: boolean;
};

export type EnrollmentRequest = {
  programId: string;
};

export type ProgramResponse = {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  active: boolean;
  price: string | null;
  paid: boolean;
  workoutCount: number;
  createdAt: string;
};

export type ProgramRequest = {
  title: string;
  description?: string | null;
  active?: boolean;
  price?: string | null;
};

export type WorkoutResponse = {
  id: string;
  programId: string;
  title: string;
  description: string | null;
  contentMarkdown: string | null;
  dayIndex: number;
  createdAt: string;
};

export type WorkoutRequest = {
  title: string;
  description?: string | null;
  contentMarkdown?: string | null;
  dayIndex: number;
};

export type SpaceCategory = "NUTRITION" | "GYM" | "CROSSFIT" | "PILATES" | "OTHER";

export type CreatorSpaceResponse = {
  id: string;
  creatorId: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  bio: string | null;
  category: SpaceCategory | null;
  createdAt: string;
};

export type CreatorSpaceRequest = {
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  bio?: string | null;
  category?: SpaceCategory | null;
};

export type CopilotAskRequest = {
  question: string;
};

export type CopilotAskResponse = {
  answer: string;
  usedFunction: string | null;
  data: unknown;
};

export type NudgeSuggestion = {
  studentId: string;
  studentName: string;
  message: string;
  assumptions: string[];
};

export type SendNudgeResponse = {
  deliveryId: string;
  studentId: string;
  emailSent: boolean;
  pushSent: boolean;
  emailDetail: string | null;
  pushDetail: string | null;
  summary: string;
};

export type StudentProgramResponse = {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  paid: boolean;
  enrolled: boolean;
  purchasePending: boolean;
};

export type OnboardingStatusResponse = {
  hasSpace: boolean;
  hasProgram: boolean;
  hasStudent: boolean;
  demoSeedAvailable: boolean;
  onboardingComplete: boolean;
};

export type LogoUploadResponse = {
  logoUrl: string;
};

export type CheckInResponse = {
  id: string;
  studentId: string;
  workoutId: string;
  date: string;
  status: CheckInStatus;
  feeling: number | null;
  notes: string | null;
};

export type CheckInRequest = {
  workoutId: string;
  date?: string | null;
  skipped?: boolean;
  feeling?: number | null;
  notes?: string | null;
};

export type BadgeResponse = {
  type: string;
  label: string;
  earnedAt: string;
};

export type GamificationProfileResponse = {
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckInsDone: number;
  badges: BadgeResponse[];
  rank: number;
};

export type LeaderboardEntryResponse = {
  rank: number;
  studentId: string;
  studentName: string;
  currentStreak: number;
  totalCheckInsDone: number;
};

export type ProgramCheckoutResponse = {
  purchaseId: string;
  checkoutUrl: string | null;
  amount: string;
  platformFee: string;
  creatorNet: string;
  message: string | null;
};

export type PurchaseStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "FAILED";

export type MarketplaceStatusResponse = {
  connected: boolean;
  walletId: string | null;
  platformFeePercent: string;
  platformFeePercentFree: string;
  platformFeePercentPro: string;
};

export type ProgramPurchaseResponse = {
  id: string;
  programId: string;
  programTitle: string;
  studentId: string;
  studentName: string;
  amount: string;
  platformFee: string;
  creatorNet: string;
  status: PurchaseStatus;
  createdAt: string;
  confirmedAt: string | null;
};

/** Maps API RiskLevel to UI badge level. */
export function riskLevelToUi(level: RiskLevel): UiRiskLevel {
  switch (level) {
    case "LOW":
      return "baixo";
    case "MEDIUM":
      return "medio";
    case "HIGH":
      return "alto";
  }
}

/** Formats BigDecimal adherence from DTO for display (already server-calculated). */
export function formatAdherence(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  return `${value}%`;
}
