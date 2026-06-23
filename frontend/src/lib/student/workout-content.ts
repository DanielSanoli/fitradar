export type ParsedExercise = {
  name: string;
  detail: string;
};

/** Parses markdown lines for display — does not compute training metrics. */
export function parseExerciseLines(markdown: string): ParsedExercise[] {
  const items: ParsedExercise[] = [];
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^[-*•]\s+(.+)/);
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    const content = bullet?.[1] ?? numbered?.[1];
    if (!content) continue;

    const setsMatch = content.match(/^(.+?)\s+(\d+\s*[x×]\s*.+)$/i);
    if (setsMatch) {
      items.push({ name: setsMatch[1].trim(), detail: setsMatch[2].trim() });
    } else {
      items.push({ name: content, detail: "" });
    }
  }
  return items;
}

export function countExercises(markdown: string | null | undefined): number {
  if (!markdown?.trim()) return 0;
  return parseExerciseLines(markdown).length;
}
