import type { CheckInResponse } from "@/lib/api/domain-types";
import { addDays, localDateKey, startOfLocalDay } from "@/lib/student/date-utils";

export type WeekBarState = "done" | "rest" | "future" | "today-empty";

export type WeekBar = {
  label: string;
  state: WeekBarState;
  isToday: boolean;
  date: string;
  /** Visual height token for the bar track (not a computed metric). */
  height: string;
};

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

function mondayOfWeek(reference: Date): Date {
  const today = startOfLocalDay(reference);
  const dow = today.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return addDays(today, offset);
}

function heightForState(state: WeekBarState): string {
  switch (state) {
    case "done":
      return "100%";
    case "rest":
      return "18%";
    case "future":
    case "today-empty":
      return "6%";
  }
}

/** Builds Mon–Sun bars for the current week from check-in DTOs. */
export function buildWeekBars(
  checkIns: CheckInResponse[],
  referenceDate: Date = new Date(),
): WeekBar[] {
  const today = startOfLocalDay(referenceDate);
  const todayKey = localDateKey(today);
  const monday = mondayOfWeek(today);

  const doneDates = new Set(
    checkIns.filter((c) => c.status === "DONE").map((c) => c.date),
  );

  return DAY_LABELS.map((label, i) => {
    const day = addDays(monday, i);
    const date = localDateKey(day);
    const isToday = date === todayKey;
    const isFuture = day > today;

    let state: WeekBarState;
    if (isFuture) {
      state = "future";
    } else if (doneDates.has(date)) {
      state = "done";
    } else if (isToday) {
      state = "today-empty";
    } else {
      state = "rest";
    }

    return {
      label,
      state,
      isToday,
      date,
      height: heightForState(state),
    };
  });
}

export function weekSummaryFromDto(weeklyDone: number | null | undefined): string {
  if (weeklyDone == null || weeklyDone < 0) return "Sem dados esta semana";
  return `${weeklyDone} treino${weeklyDone === 1 ? "" : "s"} esta semana`;
}
