import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthenticatedRadarShell } from "@/components/radar/AuthenticatedRadarShell";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";

function renderShell(path: string, auth: Partial<AuthContextValue> = {}) {
  const value: AuthContextValue = {
    user: {
      id: "1",
      name: "Ana Costa",
      email: "a@test.com",
      role: "CREATOR",
      creatorId: null,
      plan: "PRO",
      subscriptionStatus: "ACTIVE",
      trialEndsAt: null,
      subscriptionEndsAt: null,
      emailVerified: true,
      accessAllowed: true,
      accessMessage: null,
      trialDaysRemaining: 0,
    },
    isLoading: false,
    isAuthenticated: true,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    refreshUser: async () => {},
    ...auth,
  };

  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="*"
            element={
              <AuthenticatedRadarShell>
                <div>Page content</div>
              </AuthenticatedRadarShell>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("AuthenticatedRadarShell", () => {
  it("shows FAB on authenticated app routes", () => {
    renderShell("/app");
    expect(screen.getByRole("button", { name: "Abrir o Radar" })).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("shows FAB on student routes", () => {
    renderShell("/student", {
      user: {
        id: "2",
        name: "João",
        email: "j@test.com",
        role: "STUDENT",
        creatorId: "c1",
        plan: "PRO",
        subscriptionStatus: "ACTIVE",
        trialEndsAt: null,
        subscriptionEndsAt: null,
        emailVerified: true,
        accessAllowed: true,
        accessMessage: null,
        trialDaysRemaining: 0,
      },
    });
    expect(screen.getByRole("button", { name: "Abrir o Radar" })).toBeInTheDocument();
  });

  it("hides FAB on public routes", () => {
    renderShell("/login", { isAuthenticated: false, user: null });
    expect(screen.queryByRole("button", { name: "Abrir o Radar" })).not.toBeInTheDocument();
  });

  it("hides FAB while auth is loading", () => {
    renderShell("/app", { isLoading: true });
    expect(screen.queryByRole("button", { name: "Abrir o Radar" })).not.toBeInTheDocument();
  });
});
