import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressPhotoCompareSlider } from "@/components/student/ProgressPhotoCompareSlider";

describe("ProgressPhotoCompareSlider", () => {
  it("updates clip position when slider moves", () => {
    render(
      <ProgressPhotoCompareSlider
        beforeSrc="before.png"
        afterSrc="after.png"
        beforeLabel="Início"
        afterLabel="Atual"
      />,
    );

    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.getByText("Atual")).toBeInTheDocument();

    const slider = screen.getByLabelText("Comparar fotos antes e depois");
    fireEvent.change(slider, { target: { value: "25" } });
    expect(slider).toHaveValue("25");
  });
});
