import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomePage } from "@/pages/HomePage";

describe("HomePage", () => {
  it("renders landing sections, pricing and CTAs", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Saiba quem vai desistir/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Pare de adivinhar quem some/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Radar no centro/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Três passos até o primeiro nudge/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Comece grátis\. Escale no Pro/i })).toBeInTheDocument();
    expect(screen.getByText(/Recomendado/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Dúvidas frequentes/i })).toBeInTheDocument();
    expect(screen.getByText(/R\$ 49,90\/mês/i)).toBeInTheDocument();
    expect(screen.getByText(/seja um dos primeiros coaches/i)).toBeInTheDocument();

    const registerLinks = screen.getAllByRole("link", { name: /Começar grátis/i });
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0]).toHaveAttribute("href", "/register");

    expect(screen.getByRole("link", { name: /^Entrar$/i })).toHaveAttribute("href", "/login");
  });
});
