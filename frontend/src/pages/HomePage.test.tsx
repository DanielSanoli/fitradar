import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomePage } from "@/pages/HomePage";

describe("HomePage", () => {
  it("renders tour, pricing and student settings link", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /copiloto de retenção/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Como funciona/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Planos para criadores/i })).toBeInTheDocument();
    expect(screen.getByText(/Radar de retenção/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /\/student\/settings/i })).toHaveAttribute(
      "href",
      "/student/settings",
    );
  });
});
