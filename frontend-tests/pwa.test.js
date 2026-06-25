import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const publicRoot = path.resolve(import.meta.dirname, "../frontend/public");
const viteConfigPath = path.resolve(import.meta.dirname, "../frontend/vite.config.ts");

describe("React PWA assets (frontend/public)", () => {
  it("push service worker handles push and notification click", () => {
    const sw = fs.readFileSync(path.join(publicRoot, "push-sw.js"), "utf8");
    expect(sw).toContain('addEventListener("push"');
    expect(sw).toContain('addEventListener("notificationclick"');
    expect(sw).toContain("/student");
  });

  it("offline shell exists for Workbox includeAssets", () => {
    expect(fs.existsSync(path.join(publicRoot, "offline.html"))).toBe(true);
  });

  it("privacy policy is served as static HTML", () => {
    const html = fs.readFileSync(path.join(publicRoot, "privacy.html"), "utf8");
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain("Política de Privacidade");
  });

  it("terms of use is served as static HTML", () => {
    const html = fs.readFileSync(path.join(publicRoot, "terms.html"), "utf8");
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain("Termos de Uso");
  });

  it("vite PWA manifest targets student area on same origin", () => {
    const config = fs.readFileSync(viteConfigPath, "utf8");
    expect(config).toContain('start_url: "/student"');
    expect(config).toContain("App do aluno");
    expect(config).toContain('url: "/student/progress"');
    expect(config).toContain("privacy.html");
    expect(config).toContain("terms.html");
    expect(config).toContain("navigateFallbackDenylist: [/^\\/api/]");
  });
});
