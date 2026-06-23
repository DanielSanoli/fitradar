import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdherenceRing } from "@/components/fitness/AdherenceRing";

describe("AdherenceRing", () => {
  it("renders adherence value from backend DTO", () => {
    render(<AdherenceRing value="82.50" />);
    expect(screen.getByRole("img", { name: /Aderência 82\.50% em 30 dias/i })).toBeInTheDocument();
    expect(screen.getByText("82.50%")).toBeInTheDocument();
  });

  it("shows placeholder when value is null", () => {
    render(<AdherenceRing value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
