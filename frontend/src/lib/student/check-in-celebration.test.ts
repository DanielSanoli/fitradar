import { describe, expect, it, vi } from "vitest";
import {
  resolveCheckInCelebrationMessage,
  triggerCheckInHaptic,
} from "@/lib/student/check-in-celebration";

describe("resolveCheckInCelebrationMessage", () => {
  const baseBefore = {
    streak: 4,
    longestStreak: 4,
    weeklyDone: 2,
    totalCheckInsDone: 9,
  };

  it("prioritizes total check-in milestone", () => {
    const copy = resolveCheckInCelebrationMessage({
      currentStreak: 5,
      longestStreak: 5,
      totalCheckInsDone: 10,
      weeklyDone: 3,
      before: baseBefore,
    });
    expect(copy.headline).toBe("10º treino registrado!");
    expect(copy.variant).toBe("milestone");
  });

  it("celebrates 50th and 100th milestones", () => {
    expect(
      resolveCheckInCelebrationMessage({
        currentStreak: 3,
        longestStreak: 3,
        totalCheckInsDone: 50,
        weeklyDone: 1,
        before: { ...baseBefore, totalCheckInsDone: 49 },
      }).headline,
    ).toBe("50º treino registrado!");

    expect(
      resolveCheckInCelebrationMessage({
        currentStreak: 8,
        longestStreak: 8,
        totalCheckInsDone: 100,
        weeklyDone: 2,
        before: { ...baseBefore, totalCheckInsDone: 99 },
      }).headline,
    ).toBe("100º treino registrado!");
  });

  it("shows new streak record", () => {
    const copy = resolveCheckInCelebrationMessage({
      currentStreak: 12,
      longestStreak: 12,
      totalCheckInsDone: 20,
      weeklyDone: 2,
      before: { streak: 11, longestStreak: 11, weeklyDone: 1, totalCheckInsDone: 19 },
    });
    expect(copy.headline).toBe("Novo recorde: 12 dias!");
    expect(copy.variant).toBe("record");
  });

  it("shows streak multiple of five", () => {
    const copy = resolveCheckInCelebrationMessage({
      currentStreak: 15,
      longestStreak: 15,
      totalCheckInsDone: 22,
      weeklyDone: 3,
      before: { streak: 14, longestStreak: 15, weeklyDone: 2, totalCheckInsDone: 21 },
    });
    expect(copy.headline).toBe("15 dias seguidos!");
    expect(copy.variant).toBe("streak-five");
  });

  it("shows first check-in of the week", () => {
    const copy = resolveCheckInCelebrationMessage({
      currentStreak: 3,
      longestStreak: 5,
      totalCheckInsDone: 8,
      weeklyDone: 1,
      before: { streak: 2, longestStreak: 5, weeklyDone: 0, totalCheckInsDone: 7 },
    });
    expect(copy.headline).toBe("Primeiro treino da semana!");
    expect(copy.variant).toBe("week-start");
  });

  it("shows shield earned celebration", () => {
    const copy = resolveCheckInCelebrationMessage({
      currentStreak: 7,
      longestStreak: 7,
      totalCheckInsDone: 7,
      weeklyDone: 2,
      shieldEarned: true,
      before: baseBefore,
    });
    expect(copy.headline).toBe("Você ganhou um escudo!");
    expect(copy.variant).toBe("shield-earned");
  });

  it("shows shield consumed celebration", () => {
    const copy = resolveCheckInCelebrationMessage({
      currentStreak: 6,
      longestStreak: 6,
      totalCheckInsDone: 12,
      weeklyDone: 2,
      shieldConsumed: true,
      before: { ...baseBefore, streak: 5 },
    });
    expect(copy.headline).toBe("Escudo usado — sequência salva!");
    expect(copy.variant).toBe("shield-consumed");
  });

  it("falls back to default message", () => {
    const copy = resolveCheckInCelebrationMessage({
      currentStreak: 4,
      longestStreak: 8,
      totalCheckInsDone: 8,
      weeklyDone: 2,
      before: { streak: 3, longestStreak: 8, weeklyDone: 1, totalCheckInsDone: 7 },
    });
    expect(copy.headline).toBe("Treino registrado!");
    expect(copy.variant).toBe("default");
  });
});

describe("triggerCheckInHaptic", () => {
  it("vibrates when supported", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    triggerCheckInHaptic();
    expect(vibrate).toHaveBeenCalledWith([35, 40, 35]);
  });
});
