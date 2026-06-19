import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

function renderProtected(user: AuthContextValue["user"], isLoading = false) {
  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login: async () => {},
    register: async () => {},
    logout: () => {},
    refreshUser: async () => {},
  };

  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["CREATOR"]} />}>
            <Route path="/app" element={<div>Protected area</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/student" element={<div>Student home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to login", () => {
    renderProtected(null);
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects students away from creator routes", () => {
    renderProtected({
      id: "1",
      name: "Aluno",
      email: "s@test.com",
      role: "STUDENT",
      creatorId: "c1",
      plan: "FREE",
      subscriptionStatus: "ACTIVE",
      trialEndsAt: null,
      subscriptionEndsAt: null,
      emailVerified: true,
      accessAllowed: true,
      accessMessage: null,
      trialDaysRemaining: 0,
    });
    expect(screen.getByText("Student home")).toBeInTheDocument();
  });

  it("renders outlet for allowed role", () => {
    renderProtected({
      id: "1",
      name: "Creator",
      email: "c@test.com",
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
    });
    expect(screen.getByText("Protected area")).toBeInTheDocument();
  });
});
