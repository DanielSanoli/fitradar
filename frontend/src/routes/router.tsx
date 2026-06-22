import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PageLoader } from "@/components/ui/PageLoader";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { ProtectedRoute, PublicOnlyRoute } from "@/features/auth/ProtectedRoute";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { BillingRequiredPage } from "@/pages/BillingRequiredPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
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
  import("@/features/creator/ProgramsPage").then((m) => ({ default: m.ProgramDetailPage })),
);
const ProgramFormPage = lazy(() =>
  import("@/features/creator/ProgramsPage").then((m) => ({ default: m.ProgramFormPage })),
);
const SpaceBuilderPage = lazy(() =>
  import("@/features/creator/SpaceBuilderPage").then((m) => ({ default: m.SpaceBuilderPage })),
);
const StudentHomePage = lazy(() =>
  import("@/features/student/StudentHomePage").then((m) => ({ default: m.StudentHomePage })),
);
const StudentProgressPage = lazy(() =>
  import("@/features/student/StudentProgressPage").then((m) => ({
    default: m.StudentProgressPage,
  })),
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
          { index: true, element: <HomePage /> },
          {
            element: <PublicOnlyRoute />,
            children: [
              { path: "login", element: <LoginPage /> },
              { path: "register", element: <RegisterPage /> },
            ],
          },
          {
            element: <ProtectedRoute />,
            children: [{ path: "billing-required", element: <BillingRequiredPage /> }],
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
                path: "space",
                element: (
                  <Lazy>
                    <SpaceBuilderPage />
                  </Lazy>
                ),
              },
              {
                path: "retention",
                element: (
                  <PlaceholderPage
                    title="Retenção"
                    description="Alertas detalhados e reavaliação — em breve."
                  />
                ),
              },
              {
                path: "ranking",
                element: (
                  <PlaceholderPage title="Ranking" description="Gamificação — em breve." />
                ),
              },
              {
                path: "settings",
                element: (
                  <PlaceholderPage title="Configurações" description="Billing — em breve." />
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
            ],
          },
        ],
      },
      { path: "/404", element: <NotFoundPage /> },
      { path: "*", element: <Navigate to="/404" replace /> },
    ],
  },
]);
