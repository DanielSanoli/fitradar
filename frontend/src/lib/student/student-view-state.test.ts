import { describe, expect, it } from "vitest";
import {
  deriveHomeViewMode,
  deriveProgressViewMode,
} from "@/lib/student/student-view-state";
import type { StudentProgressResult } from "@/lib/api/domain-types";

const baseProgress: StudentProgressResult = {
  studentId: "1",
  studentName: "Lucas",
  enrolled: true,
  adherence: "80.00",
  currentStreak: 3,
  weeklyDone: 2,
  streakShields: 0,
  shieldEarnProgress: 0,
  nextWorkoutId: "w1",
  nextWorkoutTitle: "Lower Body",
  message: null,
  assumptions: [],
};

describe("deriveHomeViewMode", () => {
  it("returns none when not enrolled", () => {
    expect(deriveHomeViewMode({ ...baseProgress, enrolled: false })).toBe("none");
  });

  it("returns workout when next workout title is present", () => {
    expect(deriveHomeViewMode(baseProgress)).toBe("workout");
  });

  it("returns rest when enrolled without next workout", () => {
    expect(
      deriveHomeViewMode({
        ...baseProgress,
        nextWorkoutId: null,
        nextWorkoutTitle: null,
      }),
    ).toBe("rest");
  });
});

describe("deriveProgressViewMode", () => {
  it("returns early when adherence is missing", () => {
    expect(deriveProgressViewMode(10, null)).toBe("early");
  });

  it("returns early when total check-ins done is below threshold", () => {
    expect(deriveProgressViewMode(3, "75.00")).toBe("early");
  });

  it("returns active when journey has enough data", () => {
    expect(deriveProgressViewMode(12, "80.00")).toBe("active");
  });
});
