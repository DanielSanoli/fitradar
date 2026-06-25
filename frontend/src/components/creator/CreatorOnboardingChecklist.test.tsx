import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { CreatorOnboardingChecklist } from "@/components/creator/CreatorOnboardingChecklist";
import { onboardingApi } from "@/lib/api/onboarding-api";

vi.mock("@/lib/api/onboarding-api", () => ({
  onboardingApi: {
    status: vi.fn(),
    seedDemo: vi.fn(),
  },
}));

function renderChecklist() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <CreatorOnboardingChecklist />
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe("CreatorOnboardingChecklist", () => {
  beforeEach(() => {
    vi.mocked(onboardingApi.status).mockResolvedValue({
      hasSpace: false,
      hasProgram: false,
      hasStudent: false,
      demoSeedAvailable: true,
      onboardingComplete: false,
    });
  });

  it("shows checklist steps for a new creator", async () => {
    renderChecklist();

    await waitFor(() => {
      expect(screen.getByText("Primeiros passos")).toBeInTheDocument();
      expect(screen.getByText("Criar seu espaço")).toBeInTheDocument();
      expect(screen.getByText("Publicar o 1º programa")).toBeInTheDocument();
      expect(screen.getByText("Convidar primeiro aluno")).toBeInTheDocument();
      expect(screen.getByText("0/3 concluídos")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /configurar espaço/i })).toHaveAttribute(
      "href",
      "/app/space",
    );
    expect(screen.getByRole("button", { name: /ver com dados de exemplo/i })).toBeInTheDocument();
  });

  it("marks completed steps from API status", async () => {
    vi.mocked(onboardingApi.status).mockResolvedValue({
      hasSpace: true,
      hasProgram: true,
      hasStudent: false,
      demoSeedAvailable: false,
      onboardingComplete: false,
    });

    renderChecklist();

    await waitFor(() => {
      expect(screen.getByText("2/3 concluídos")).toBeInTheDocument();
      expect(screen.getAllByText("Feito")).toHaveLength(2);
      expect(screen.getByText("Próximo passo")).toBeInTheDocument();
    });
  });

  it("hides checklist when onboarding is complete", async () => {
    vi.mocked(onboardingApi.status).mockResolvedValue({
      hasSpace: true,
      hasProgram: true,
      hasStudent: true,
      demoSeedAvailable: false,
      onboardingComplete: true,
    });

    renderChecklist();

    await waitFor(() => {
      expect(onboardingApi.status).toHaveBeenCalled();
    });

    expect(screen.queryByText("Primeiros passos")).not.toBeInTheDocument();
  });

  it("seeds demo data from the action button", async () => {
    vi.mocked(onboardingApi.seedDemo).mockResolvedValue({
      hasSpace: false,
      hasProgram: true,
      hasStudent: false,
      demoSeedAvailable: false,
      onboardingComplete: false,
    });

    const user = userEvent.setup();
    renderChecklist();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /ver com dados de exemplo/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /ver com dados de exemplo/i }));

    await waitFor(() => {
      expect(onboardingApi.seedDemo).toHaveBeenCalled();
      expect(screen.getByText("1/3 concluídos")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ver com dados de exemplo/i })).not.toBeInTheDocument();
    });
  });
});
