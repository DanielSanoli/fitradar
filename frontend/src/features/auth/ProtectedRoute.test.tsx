import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

const creatorBase = {
  id: "1",
  name: "Creator",
  email: "c@test.com",
  role: "CREATOR" as const,
  creatorId: null,
  plan: "FREE" as const,
  subscriptionStatus: "TRIALING" as const,
  trialEndsAt: null,
  subscriptionEndsAt: null,
  emailVerified: true,
  accessAllowed: true,
  accessMessage: null,
  trialDaysRemaining: 0,
  mustChangePassword: false,
  termsAccepted: true,
};

function renderProtected(
  user: AuthContextValue["user"],
  initialPath = "/app",
  isLoading = false,
) {
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
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["CREATOR"]} />}>
            <Route path="/app" element={<div>Protected area</div>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<div>Change password</div>} />
            <Route path="/accept-terms" element={<div>Accept terms</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/student" element={<div>Student home</div>} />
          <Route path="/billing-required" element={<div>Billing required</div>} />
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
      ...creatorBase,
      role: "STUDENT",
      creatorId: "c1",
    });
    expect(screen.getByText("Student home")).toBeInTheDocument();
  });

  it("redirects users with temporary password to change-password", () => {
    renderProtected(
      {
        ...creatorBase,
        role: "STUDENT",
        creatorId: "c1",
        mustChangePassword: true,
      },
      "/app",
    );
    expect(screen.getByText("Change password")).toBeInTheDocument();
  });

  it("keeps invited students on change-password when terms are pending", () => {
    renderProtected(
      {
        ...creatorBase,
        role: "STUDENT",
        creatorId: "c1",
        mustChangePassword: true,
        termsAccepted: false,
      },
      "/change-password",
    );
    expect(screen.getByText("Change password")).toBeInTheDocument();
    expect(screen.queryByText("Accept terms")).not.toBeInTheDocument();
  });

  it("redirects users without terms acceptance to accept-terms", () => {
    renderProtected(
      {
        ...creatorBase,
        termsAccepted: false,
      },
      "/app",
    );
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
  });

  it("renders outlet for allowed role with access", () => {
    renderProtected({
      ...creatorBase,
    });
    expect(screen.getByText("Protected area")).toBeInTheDocument();
  });

  it("allows creator with expired trial when basic access is granted", () => {
    renderProtected({
      ...creatorBase,
      accessAllowed: true,
      accessMessage: "Trial expirado",
      hasProFeatures: false,
    });
    expect(screen.getByText("Protected area")).toBeInTheDocument();
  });
});
