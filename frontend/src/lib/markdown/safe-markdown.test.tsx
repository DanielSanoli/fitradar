import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderSafeMarkdown } from "@/lib/markdown/safe-markdown";

describe("safe-markdown", () => {
  it("renders bullet lists without HTML injection", () => {
    render(<div>{renderSafeMarkdown("- Agachamento\n- Supino\n<script>x</script>")}</div>);
    expect(screen.getByText("Agachamento")).toBeInTheDocument();
    expect(screen.getByText("Supino")).toBeInTheDocument();
    expect(screen.getByText("<script>x</script>")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });
});
