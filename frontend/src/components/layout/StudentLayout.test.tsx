import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { STUDENT_NAV_ITEMS } from "@/lib/student/student-nav";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { name: "Lucas Alves", role: "STUDENT" },
    logout: vi.fn(),
  }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<StudentLayout />}>
          <Route path="/student" element={<div data-testid="page-home">Home</div>} />
          <Route path="/student/progress" element={<div data-testid="page-progress">Progress</div>} />
          <Route path="/student/settings" element={<div data-testid="page-settings">Settings</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function bottomNav() {
  return within(screen.getByTestId("student-bottom-nav"));
}

describe("StudentLayout bottom nav", () => {
  it("renders all nav items on /student", () => {
    renderAt("/student");

    const nav = bottomNav();
    expect(nav.getAllByRole("link")).toHaveLength(STUDENT_NAV_ITEMS.length);
    expect(nav.getByRole("link", { name: "Início" })).toBeVisible();
    expect(nav.getByRole("link", { name: "Progresso" })).toBeVisible();
    expect(nav.getByRole("link", { name: "Perfil" })).toBeVisible();
  });

  it("renders all nav items on /student/progress", () => {
    renderAt("/student/progress");

    const nav = bottomNav();
    expect(nav.getAllByRole("link")).toHaveLength(STUDENT_NAV_ITEMS.length);
    expect(nav.getByRole("link", { name: "Início" })).toBeVisible();
    expect(nav.getByRole("link", { name: "Progresso" })).toBeVisible();
    expect(nav.getByRole("link", { name: "Perfil" })).toBeVisible();
  });

  it("marks the current route with aria-current and keeps others navigable", () => {
    renderAt("/student/progress");

    const nav = bottomNav();
    const inicio = nav.getByRole("link", { name: "Início" });
    const progresso = nav.getByRole("link", { name: "Progresso" });

    expect(progresso).toHaveAttribute("aria-current", "page");
    expect(inicio).not.toHaveAttribute("aria-current");
    expect(inicio).toHaveAttribute("href", "/student");
    expect(progresso).toHaveAttribute("href", "/student/progress");
  });

  it("highlights Perfil when on /student/settings", () => {
    renderAt("/student/settings");

    const nav = bottomNav();
    expect(nav.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Perfil" })).toHaveAttribute("href", "/student/settings");
  });

  it("highlights Início when on /student", () => {
    renderAt("/student");

    const nav = bottomNav();
    expect(nav.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Progresso" })).not.toHaveAttribute("aria-current");
  });

  it("gives inactive tabs a visible background (not transparent)", () => {
    renderAt("/student/progress");

    const inicio = bottomNav().getByRole("link", { name: "Início" });
    expect(inicio.className).toMatch(/bg-secondary/);
  });
});
