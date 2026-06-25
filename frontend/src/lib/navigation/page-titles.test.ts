import { describe, expect, it } from "vitest";
import { resolveStaticPageTitle } from "@/lib/navigation/page-titles";

describe("resolveStaticPageTitle", () => {
  it("resolves static routes", () => {
    expect(resolveStaticPageTitle("/app/settings")).toBe("Configurações");
    expect(resolveStaticPageTitle("/student/settings")).toBe("Perfil");
  });

  it("resolves dynamic route fallbacks", () => {
    expect(resolveStaticPageTitle("/app/students/abc")).toBe("Aluno");
    expect(resolveStaticPageTitle("/app/programs/p1/workouts/new")).toBe("Novo treino");
    expect(resolveStaticPageTitle("/student/workouts/w1")).toBe("Treino");
  });
});
