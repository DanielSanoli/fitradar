import { parseExerciseLines } from "@/lib/student/workout-content";

export type WorkoutExerciseRow = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
};

export function newExerciseRow(): WorkoutExerciseRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    sets: "3",
    reps: "12",
    rest: "60s",
  };
}

export function exercisesToMarkdown(exercises: WorkoutExerciseRow[]): string {
  return exercises
    .filter((e) => e.name.trim())
    .map((e) => {
      const setsReps =
        e.sets.trim() && e.reps.trim()
          ? `${e.sets.trim()}x${e.reps.trim()}`
          : e.reps.trim() || e.sets.trim();
      const rest = e.rest.trim() ? ` · ${e.rest.trim()}` : "";
      return `- ${e.name.trim()}${setsReps ? ` ${setsReps}` : ""}${rest}`;
    })
    .join("\n");
}

export function markdownToExercises(markdown: string | null | undefined): WorkoutExerciseRow[] {
  if (!markdown?.trim()) return [];
  return parseExerciseLines(markdown).map((line) => {
    const restMatch = line.detail.match(/·\s*(.+)$/);
    const rest = restMatch?.[1]?.trim() ?? "";
    const detailWithoutRest = restMatch
      ? line.detail.replace(/\s*·\s*.+$/, "").trim()
      : line.detail;
    const setsReps = detailWithoutRest.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    return {
      id: crypto.randomUUID(),
      name: line.name,
      sets: setsReps?.[1] ?? "",
      reps: setsReps?.[2] ?? detailWithoutRest,
      rest,
    };
  });
}

export function exercisePreview(markdown: string | null | undefined, max = 2): string {
  const rows = markdownToExercises(markdown);
  if (rows.length === 0) return "Sem exercícios ainda.";
  const names = rows.slice(0, max).map((r) => r.name);
  const extra = rows.length > max ? ` +${rows.length - max}` : "";
  return names.join(", ") + extra;
}
