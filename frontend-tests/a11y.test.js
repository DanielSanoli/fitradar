import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const staticRoot = path.resolve(import.meta.dirname, "../src/main/resources/static");

function read(name) {
  return fs.readFileSync(path.join(staticRoot, name), "utf8");
}

describe("a11y structure (smoke)", () => {
  it("student.html has skip link, lang, labels and button types", () => {
    const html = read("student.html");
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain('class="skip-link"');
    expect(html).toMatch(/for="email"/);
    expect(html).toMatch(/for="password"/);
    expect(html).toMatch(/type="submit"/);
    expect(html).toMatch(/aria-labelledby="programs-heading"/);
    expect(html).toMatch(/aria-labelledby="workouts-heading"/);
  });

  it("app.html has nav aria-label, form labels and live regions", () => {
    const html = read("app.html");
    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain('aria-label="Seções do painel"');
    expect(html).toMatch(/for="ask-input"/);
    expect(html).toMatch(/for="wallet-id"/);
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toMatch(/type="button"/);
  });

  it("index.html auth forms associate labels with inputs", () => {
    const html = read("index.html");
    expect(html).toMatch(/for="login-email"/);
    expect(html).toMatch(/for="login-password"/);
    expect(html).toMatch(/for="reg-name"/);
    expect(html).toMatch(/for="reg-email"/);
    expect(html).toMatch(/for="reg-password"/);
  });
});
