import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RadarFloatingWidget } from "@/components/radar/RadarFloatingWidget";
import { RadarCopilotProvider } from "@/features/radar/RadarCopilotProvider";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import type { User } from "@/lib/api/types";

vi.mock("@/lib/api/copilot-api", () => ({
  copilotApi: {
    ask: vi.fn(),
  },
}));

function buildAuth(role: User["role"]): AuthContextValue {
  return {
    user: {
      id: "1",
      name: "Ana Costa",
      email: "a@test.com",
      role,
      creatorId: role === "STUDENT" ? "c1" : null,
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
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };
}

function renderWidget(role: User["role"]) {
  return render(
    <AuthContext.Provider value={buildAuth(role)}>
      <MemoryRouter>
        <RadarCopilotProvider>
          <RadarFloatingWidget />
        </RadarCopilotProvider>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RadarFloatingWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders FAB with aria-expanded false initially", () => {
    renderWidget("CREATOR");
    const fab = screen.getByRole("button", { name: "Abrir o Radar" });
    expect(fab).toHaveAttribute("aria-expanded", "false");
    expect(fab).toHaveAttribute("aria-controls", "radar-chat-panel");
  });

  it("opens and closes the chat panel", async () => {
    const user = userEvent.setup();
    renderWidget("CREATOR");

    await user.click(screen.getByRole("button", { name: "Abrir o Radar" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Pergunte sobre os alunos em risco ou a visão geral/i),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Abrir o Radar" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("shows creator copilot copy for creators", async () => {
    const user = userEvent.setup();
    renderWidget("CREATOR");

    await user.click(screen.getByRole("button", { name: "Abrir o Radar" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Pergunte sobre os alunos em risco ou a visão geral/i),
      ).toBeInTheDocument();
    });
  });

  it("shows student copilot copy for students", async () => {
    const user = userEvent.setup();
    renderWidget("STUDENT");

    await user.click(screen.getByRole("button", { name: "Abrir o Radar" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByText(/Pergunte sobre seu progresso, aderência ou streak/i),
      ).toBeInTheDocument();
    });
  });

  it("shows student suggestion chips when panel opens", async () => {
    const user = userEvent.setup();
    renderWidget("STUDENT");

    await user.click(screen.getByRole("button", { name: "Abrir o Radar" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Como estou indo?" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Qual meu streak?" })).toBeInTheDocument();
    });
  });

  it("anchors student panel above bottom nav on mobile", async () => {
    const user = userEvent.setup();
    renderWidget("STUDENT");

    await user.click(screen.getByRole("button", { name: "Abrir o Radar" }));

    await waitFor(() => {
      const panel = document.getElementById("radar-chat-panel");
      expect(panel).toBeInTheDocument();
      expect(panel?.className).toMatch(/max-md:bottom-24/);
      expect(panel?.className).toMatch(/max-md:max-h-\[min\(calc\(100dvh-6\.5rem\),640px\)\]/);
    });
  });

  it("positions FAB above student bottom nav on mobile", () => {
    renderWidget("STUDENT");
    const fab = screen.getByRole("button", { name: "Abrir o Radar" });
    expect(fab.className).toMatch(/bottom-24/);
  });
});
