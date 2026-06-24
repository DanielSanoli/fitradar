import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PublicSpacePage } from "@/features/public/PublicSpacePage";
import { publicSpaceApi } from "@/lib/api/public-space-api";
import { ApiError } from "@/lib/api/types";

vi.mock("@/lib/api/public-space-api", () => ({
  publicSpaceApi: { getBySlug: vi.fn() },
}));

function renderPage(slug = "studio-fit") {
  return render(
    <MemoryRouter initialEntries={[`/c/${slug}`]}>
      <Routes>
        <Route path="/c/:slug" element={<PublicSpacePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicSpacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders public space branding and login path", async () => {
    vi.mocked(publicSpaceApi.getBySlug).mockResolvedValue({
      id: "s1",
      creatorId: "c1",
      name: "Studio Fit",
      slug: "studio-fit",
      logoUrl: null,
      primaryColor: "#1ed7a6",
      bio: "Treinos personalizados.",
      category: "GYM",
      createdAt: "2026-01-01T00:00:00Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Studio Fit" })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Entrar no espaço/i })).toHaveAttribute("href", "/login");
    expect(screen.getByText("Treinos personalizados.")).toBeInTheDocument();
  });

  it("shows not found for missing slug", async () => {
    vi.mocked(publicSpaceApi.getBySlug).mockRejectedValue(new ApiError(404, "Espaço não encontrado"));

    renderPage("inexistente");

    expect(await screen.findByText(/Espaço não encontrado/i)).toBeInTheDocument();
  });
});
