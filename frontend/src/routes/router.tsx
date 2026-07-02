import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PageLoader } from "@/components/ui/PageLoader";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LoginRoute } from "@/features/auth/LoginRoute";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ForceChangePasswordPage } from "@/features/auth/ForceChangePasswordPage";
import { AcceptTermsPage } from "@/features/auth/AcceptTermsPage";
import { GuestOnlyRoute, ProtectedRoute, PublicOnlyRoute } from "@/features/auth/ProtectedRoute";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { BillingRequiredPage } from "@/pages/BillingRequiredPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RootLayout } from "@/routes/RootLayout";

const CreatorDashboardPage = lazy(() =>
  import("@/features/creator/CreatorDashboardPage").then((m) => ({
    default: m.CreatorDashboardPage,
  })),
);
const StudentsPage = lazy(() =>
  import("@/features/creator/StudentsPage").then((m) => ({ default: m.StudentsPage })),
);
const StudentDetailPage = lazy(() =>
  import("@/features/creator/StudentDetailPage").then((m) => ({ default: m.StudentDetailPage })),
);
const ProgramsListPage = lazy(() =>
  import("@/features/creator/ProgramsPage").then((m) => ({ default: m.ProgramsListPage })),
);
const ProgramDetailPage = lazy(() =>
  import("@/features/creator/ProgramDetailPage").then((m) => ({ default: m.ProgramDetailPage })),
);
const ProgramFormPage = lazy(() =>
  import("@/features/creator/ProgramFormPage").then((m) => ({ default: m.ProgramFormPage })),
);
const WorkoutFormPage = lazy(() =>
  import("@/features/creator/WorkoutFormPage").then((m) => ({ default: m.WorkoutFormPage })),
);
const SpaceBuilderLayout = lazy(() =>
  import("@/components/layout/SpaceBuilderLayout").then((m) => ({
    default: m.SpaceBuilderLayout,
  })),
);
const SpaceBuilderPage = lazy(() =>
  import("@/features/creator/SpaceBuilderPage").then((m) => ({ default: m.SpaceBuilderPage })),
);
const StudentHomePage = lazy(() =>
  import("@/features/student/StudentHomePage").then((m) => ({ default: m.StudentHomePage })),
);
const CreatorSettingsPage = lazy(() =>
  import("@/features/creator/CreatorSettingsPage").then((m) => ({
    default: m.CreatorSettingsPage,
  })),
);
const CreatorMarketplacePage = lazy(() =>
  import("@/features/creator/CreatorMarketplacePage").then((m) => ({
    default: m.CreatorMarketplacePage,
  })),
);
const RetentionPage = lazy(() =>
  import("@/features/creator/RetentionPage").then((m) => ({ default: m.RetentionPage })),
);
const RankingPage = lazy(() =>
  import("@/features/creator/RankingPage").then((m) => ({ default: m.RankingPage })),
);
const StudentSettingsPage = lazy(() =>
  import("@/features/student/StudentSettingsPage").then((m) => ({
    default: m.StudentSettingsPage,
  })),
);
const StudentProgressPage = lazy(() =>
  import("@/features/student/StudentProgressPage").then((m) => ({
    default: m.StudentProgressPage,
  })),
);
const StudentProgramsPage = lazy(() =>
  import("@/features/student/StudentProgramsPage").then((m) => ({
    default: m.StudentProgramsPage,
  })),
);
const StudentCheckInHistoryPage = lazy(() =>
  import("@/features/student/StudentCheckInHistoryPage").then((m) => ({
    default: m.StudentCheckInHistoryPage,
  })),
);
const StudentWorkoutDetailPage = lazy(() =>
  import("@/features/student/StudentWorkoutDetailPage").then((m) => ({
    default: m.StudentWorkoutDetailPage,
  })),
);
const StudentAnamnesePage = lazy(() =>
  import("@/features/student/StudentAnamnesePage").then((m) => ({
    default: m.StudentAnamnesePage,
  })),
);
const StudentNutritionPlanPage = lazy(() =>
  import("@/features/student/StudentNutritionPlanPage").then((m) => ({
    default: m.StudentNutritionPlanPage,
  })),
);
const PublicSpacePage = lazy(() =>
  import("@/features/public/PublicSpacePage").then((m) => ({ default: m.PublicSpacePage })),
);

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            element: <GuestOnlyRoute />,
            children: [{ index: true, element: <HomePage /> }],
          },
          {
            element: <PublicOnlyRoute />,
            children: [
              { path: "login", element: <LoginRoute /> },
              { path: "forgot-password", element: <ForgotPasswordPage /> },
              { path: "register", element: <RegisterPage /> },
            ],
          },
          {
            element: <ProtectedRoute />,
            children: [
              { path: "billing-required", element: <BillingRequiredPage /> },
              { path: "change-password", element: <ForceChangePasswordPage /> },
              { path: "accept-terms", element: <AcceptTermsPage /> },
              {
                path: "anamnese",
                element: (
                  <Lazy>
                    <StudentAnamnesePage />
                  </Lazy>
                ),
              },
            ],
          },
        ],
      },
      {
        path: "/app",
        element: <ProtectedRoute allowedRoles={["CREATOR", "ADMIN"]} />,
        children: [
          {
            element: <AppLayout variant="creator" />,
            children: [
              {
                index: true,
                element: (
                  <Lazy>
                    <CreatorDashboardPage />
                  </Lazy>
                ),
              },
              {
                path: "students",
                element: (
                  <Lazy>
                    <StudentsPage />
                  </Lazy>
                ),
              },
              {
                path: "students/:id",
                element: (
                  <Lazy>
                    <StudentDetailPage />
                  </Lazy>
                ),
              },
              {
                path: "programs",
                element: (
                  <Lazy>
                    <ProgramsListPage />
                  </Lazy>
                ),
              },
              {
                path: "programs/new",
                element: (
                  <Lazy>
                    <ProgramFormPage mode="create" />
                  </Lazy>
                ),
              },
              {
                path: "programs/:id",
                element: (
                  <Lazy>
                    <ProgramDetailPage />
                  </Lazy>
                ),
              },
              {
                path: "programs/:id/edit",
                element: (
                  <Lazy>
                    <ProgramFormPage mode="edit" />
                  </Lazy>
                ),
              },
              {
                path: "programs/:id/workouts/new",
                element: (
                  <Lazy>
                    <WorkoutFormPage mode="create" />
                  </Lazy>
                ),
              },
              {
                path: "programs/:id/workouts/:workoutId/edit",
                element: (
                  <Lazy>
                    <WorkoutFormPage mode="edit" />
                  </Lazy>
                ),
              },
              {
                path: "retention",
                element: (
                  <Lazy>
                    <RetentionPage />
                  </Lazy>
                ),
              },
              {
                path: "ranking",
                element: (
                  <Lazy>
                    <RankingPage />
                  </Lazy>
                ),
              },
              {
                path: "marketplace",
                element: (
                  <Lazy>
                    <CreatorMarketplacePage />
                  </Lazy>
                ),
              },
              {
                path: "settings",
                element: (
                  <Lazy>
                    <CreatorSettingsPage />
                  </Lazy>
                ),
              },
            ],
          },
          {
            path: "space",
            element: (
              <Lazy>
                <SpaceBuilderLayout />
              </Lazy>
            ),
            children: [
              {
                index: true,
                element: (
                  <Lazy>
                    <SpaceBuilderPage />
                  </Lazy>
                ),
              },
            ],
          },
        ],
      },
      {
        path: "/student",
        element: <ProtectedRoute allowedRoles={["STUDENT"]} />,
        children: [
          {
            element: <AppLayout variant="student" />,
            children: [
              {
                index: true,
                element: (
                  <Lazy>
                    <StudentHomePage />
                  </Lazy>
                ),
              },
              {
                path: "progress",
                element: (
                  <Lazy>
                    <StudentProgressPage />
                  </Lazy>
                ),
              },
              {
                path: "programs",
                element: (
                  <Lazy>
                    <StudentProgramsPage />
                  </Lazy>
                ),
              },
              {
                path: "programs/:programId/nutrition",
                element: (
                  <Lazy>
                    <StudentNutritionPlanPage />
                  </Lazy>
                ),
              },
              {
                path: "history",
                element: (
                  <Lazy>
                    <StudentCheckInHistoryPage />
                  </Lazy>
                ),
              },
              {
                path: "workouts/:workoutId",
                element: (
                  <Lazy>
                    <StudentWorkoutDetailPage />
                  </Lazy>
                ),
              },
              {
                path: "settings",
                element: (
                  <Lazy>
                    <StudentSettingsPage />
                  </Lazy>
                ),
              },
            ],
          },
        ],
      },
      {
        path: "c/:slug",
        element: (
          <Lazy>
            <PublicSpacePage />
          </Lazy>
        ),
      },
      { path: "/404", element: <NotFoundPage /> },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);
