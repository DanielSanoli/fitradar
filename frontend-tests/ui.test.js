import { beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const staticRoot = path.resolve(import.meta.dirname, "../src/main/resources/static");

function bootUi() {
  const apiCode = fs.readFileSync(path.join(staticRoot, "js/api.js"), "utf8");
  const uiCode = fs.readFileSync(path.join(staticRoot, "js/ui.js"), "utf8");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    runScripts: "dangerously",
  });
  dom.window.eval(apiCode);
  dom.window.eval(uiCode);
  return { FRUI: dom.window.FRUI, document: dom.window.document };
}

describe("FRUI panel states", () => {
  let FRUI;
  let document;

  beforeEach(() => {
    ({ FRUI, document } = bootUi());
    document.body.innerHTML = '<div id="panel"></div>';
  });

  it("renders skeleton loading state", () => {
    FRUI.setLoading("panel", { rows: 2 });
    const panel = document.getElementById("panel");
    expect(panel.getAttribute("aria-busy")).toBe("true");
    expect(panel.querySelectorAll(".skeleton").length).toBe(2);
  });

  it("renders empty state with CTA", () => {
    let clicked = false;
    FRUI.setEmpty("panel", {
      title: "Sem alunos",
      message: "Convide o primeiro aluno da sua comunidade.",
      actionLabel: "Convidar",
      actionId: "cta-invite",
      onAction: () => { clicked = true; },
    });
    document.getElementById("cta-invite").click();
    expect(clicked).toBe(true);
    expect(document.getElementById("panel").textContent).toContain("Convide o primeiro");
  });

  it("renders error state with retry", () => {
    let retried = false;
    FRUI.setError("panel", {
      message: "Falha de rede",
      onRetry: () => { retried = true; },
    });
    document.getElementById("panel").querySelector("button").click();
    expect(retried).toBe(true);
    expect(document.getElementById("panel").querySelector(".panel-error").getAttribute("role")).toBe("alert");
  });
});
