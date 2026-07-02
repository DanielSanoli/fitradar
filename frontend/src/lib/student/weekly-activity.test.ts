import { describe, expect, it } from "vitest";
import { buildWeekBars, weekSummaryFromDto } from "@/lib/student/weekly-activity";
import type { CheckInResponse } from "@/lib/api/domain-types";

describe("buildWeekBars", () => {
  it("marks today as done when check-in exists on that date", () => {
    const ref = new Date(2026, 5, 19, 12, 0, 0);
    const todayKey = "2026-06-19";
    const checkIns: CheckInResponse[] = [
      {
        id: "1",
        studentId: "s1",
        workoutId: "w1",
        date: todayKey,
        status: "DONE",
        feeling: null,
        notes: null,
        streakShields: 0,
        shieldEarnProgress: 0,
        shieldEarned: false,
        shieldConsumed: false,
      },
    ];

    const bars = buildWeekBars(checkIns, ref);
    const todayBar = bars.find((b) => b.date === todayKey);
    expect(todayBar?.state).toBe("done");
    expect(todayBar?.height).toBe("100%");
  });
});

describe("weekSummaryFromDto", () => {
  it("formats weekly done from DTO", () => {
    expect(weekSummaryFromDto(3)).toBe("3 treinos esta semana");
    expect(weekSummaryFromDto(1)).toBe("1 treino esta semana");
  });

  it("handles missing data", () => {
    expect(weekSummaryFromDto(null)).toBe("Sem dados esta semana");
  });
});
