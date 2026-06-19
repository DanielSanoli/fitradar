import { createBrowserRouter, Navigate } from "react-router-dom";
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
                  <PlaceholderPage
                    title="Visão geral"
                    description="Dashboard do criador — métricas e alertas virão no FE-2."
                  />
                ),
              },
              {
                path: "retention",
                element: (
                  <PlaceholderPage
                    title="Retenção"
                    description="Radar de risco e copiloto — FE-2."
                  />
                ),
              },
              {
                path: "students",
                element: (
                  <PlaceholderPage title="Alunos" description="Gestão de alunos — FE-2." />
                ),
              },
              {
                path: "ranking",
                element: (
                  <PlaceholderPage title="Ranking" description="Gamificação — FE-2." />
                ),
              },
              {
                path: "settings",
                element: (
                  <PlaceholderPage title="Configurações" description="Espaço e billing — FE-2." />
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
                  <PlaceholderPage
                    title="Início"
                    description="Home do aluno — programas e check-in no FE-2."
                  />
                ),
              },
              {
                path: "progress",
                element: (
                  <PlaceholderPage title="Progresso" description="Métricas do aluno — FE-2." />
                ),
              },
              {
                path: "workouts",
                element: (
                  <PlaceholderPage title="Treinos" description="Lista de treinos — FE-2." />
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
