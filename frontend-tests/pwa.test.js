import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const staticRoot = path.resolve(import.meta.dirname, "../src/main/resources/static");

describe("PWA assets", () => {
  it("manifest is valid JSON with required fields", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(staticRoot, "manifest.webmanifest"), "utf8")
    );
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("service worker registers push and cache handlers", () => {
    const sw = fs.readFileSync(path.join(staticRoot, "sw.js"), "utf8");
    expect(sw).toContain("addEventListener(\"install\"");
    expect(sw).toContain("addEventListener(\"fetch\"");
    expect(sw).toContain("addEventListener(\"push\"");
    expect(sw).toContain("skipWaiting");
  });

  it("pwa.js registers service worker", () => {
    const pwa = fs.readFileSync(path.join(staticRoot, "js/pwa.js"), "utf8");
    expect(pwa).toContain("serviceWorker.register");
    expect(pwa).toContain("Notification");
  });

  it("student.html links manifest and pwa script", () => {
    const html = fs.readFileSync(path.join(staticRoot, "student.html"), "utf8");
    expect(html).toContain('rel="manifest"');
    expect(html).toContain("/js/pwa.js");
  });
});
