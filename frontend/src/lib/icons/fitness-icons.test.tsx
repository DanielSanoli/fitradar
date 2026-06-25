import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FitnessEmptyIcon } from "@/components/fitness/FitnessEmptyIcon";
import { SpaceVocabularyProvider } from "@/hooks/useSpaceVocabulary";
import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import { fitnessIconMap } from "@/lib/icons/fitness-icons";

describe("fitness icons", () => {
  const authValue: AuthContextValue = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };

  it("maps all contexts to lucide components", () => {
    expect(fitnessIconMap.workout).toBeDefined();
    expect(fitnessIconMap.streak).toBeDefined();
    expect(fitnessIconMap.adherence).toBeDefined();
    expect(fitnessIconMap.checkIn).toBeDefined();
    expect(fitnessIconMap.ranking).toBeDefined();
  });

  it("renders empty icon as decorative", () => {
    const { container } = render(<FitnessEmptyIcon context="workout" variant="student" />);
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
  });

  it("uses sr-only for workout thumbnail label", async () => {
    const { WorkoutThumbnail } = await import("@/components/fitness/WorkoutThumbnail");
    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <SpaceVocabularyProvider>
            <WorkoutThumbnail title="Leg day" />
          </SpaceVocabularyProvider>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText(/Treino: Leg day/)).toHaveClass("sr-only");
  });
});
