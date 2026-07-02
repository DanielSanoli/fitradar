import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MonthlyRecapResult } from "@/lib/api/domain-types";
import {
  drawMonthlyRecapStory,
  STORY_HEIGHT,
  STORY_WIDTH,
} from "@/lib/student/monthly-recap-canvas";

const baseRecap: MonthlyRecapResult = {
  year: 2026,
  month: 6,
  monthLabel: "Junho de 2026",
  hasData: true,
  workoutsDone: 12,
  adherence: "82.50",
  longestStreakInMonth: 5,
  xpEarned: 120,
  highlightBadge: { type: "STREAK_7", label: "Streak de 7 dias", earnedAt: "2026-06-15T12:00:00Z" },
  comparison: { workoutsDoneDelta: 3, adherenceDelta: "12.50", longestStreakDelta: 2 },
  branding: { spaceName: "Studio Fit", logoUrl: null, primaryColor: "#22c55e" },
  assumptions: [],
};

function createMockContext() {
  return {
    fillStyle: "",
    font: "",
    textAlign: "left" as CanvasTextAlign,
    lineWidth: 1,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([10, 20, 30, 255]) })),
  };
}

describe("monthly-recap-canvas", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "Image",
      class {
        crossOrigin = "";
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          this.onload?.();
        }
      },
    );
  });

  it("uses story dimensions for share card", () => {
    expect(STORY_WIDTH).toBe(1080);
    expect(STORY_HEIGHT).toBe(1920);
  });

  it("drawMonthlyRecapStory renders stats on canvas", async () => {
    const canvas = document.createElement("canvas");
    const ctx = createMockContext();
    vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    await drawMonthlyRecapStory(canvas, baseRecap);

    expect(canvas.width).toBe(STORY_WIDTH);
    expect(canvas.height).toBe(STORY_HEIGHT);
    expect(ctx.fillText).toHaveBeenCalledWith("Studio Fit", expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith("12", expect.any(Number), expect.any(Number));
  });
});
