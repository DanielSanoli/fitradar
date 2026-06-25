import type { ItemContentSchema } from "@/lib/space/vocabulary";

export type ItemContentRow = {
  id: string;
  name: string;
  fields: Record<string, string>;
};

export type ParsedItemContent = {
  name: string;
  fields: Record<string, string>;
};

const FITNESS_DEFAULTS: Record<string, string> = {
  sets: "3",
  reps: "12",
  rest: "60s",
};

const NUTRITION_DEFAULTS: Record<string, string> = {
  quantity: "",
  preparation: "",
};

const FIELD_KEYS: Record<ItemContentSchema, string[]> = {
  fitness: ["sets", "reps", "rest"],
  nutrition: ["quantity", "preparation"],
};

export function newItemContentRow(schema: ItemContentSchema): ItemContentRow {
  const defaults = schema === "nutrition" ? NUTRITION_DEFAULTS : FITNESS_DEFAULTS;
  const fields = Object.fromEntries(
    FIELD_KEYS[schema].map((key) => [key, defaults[key] ?? ""]),
  );
  return { id: crypto.randomUUID(), name: "", fields };
}

export function itemContentToMarkdown(
  rows: ItemContentRow[],
  schema: ItemContentSchema,
): string {
  return rows
    .filter((row) => row.name.trim())
    .map((row) => serializeRow(row, schema))
    .join("\n");
}

function serializeRow(row: ItemContentRow, schema: ItemContentSchema): string {
  const name = row.name.trim();
  if (schema === "nutrition") {
    const quantity = row.fields.quantity?.trim() ?? "";
    const preparation = row.fields.preparation?.trim() ?? "";
    let line = `- ${name}`;
    if (quantity) line += ` · ${quantity}`;
    if (preparation) line += ` · ${preparation}`;
    return line;
  }

  const sets = row.fields.sets?.trim() ?? "";
  const reps = row.fields.reps?.trim() ?? "";
  const rest = row.fields.rest?.trim() ?? "";
  const setsReps =
    sets && reps ? `${sets}x${reps}` : reps || sets;
  const restSuffix = rest ? ` · ${rest}` : "";
  return `- ${name}${setsReps ? ` ${setsReps}` : ""}${restSuffix}`;
}

export function markdownToItemContent(
  markdown: string | null | undefined,
  schema: ItemContentSchema,
): ItemContentRow[] {
  if (!markdown?.trim()) return [];

  return parseItemContentLines(markdown, schema).map((line) => ({
    id: crypto.randomUUID(),
    name: line.name,
    fields: { ...line.fields },
  }));
}

export function parseItemContentLines(
  markdown: string,
  schema: ItemContentSchema,
): ParsedItemContent[] {
  const items: ParsedItemContent[] = [];

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^[-*•]\s+(.+)/);
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    const content = bullet?.[1] ?? numbered?.[1];
    if (!content) continue;

    items.push(
      schema === "nutrition" ? parseNutritionContent(content) : parseFitnessContent(content),
    );
  }

  return items;
}

function parseNutritionContent(content: string): ParsedItemContent {
  const parts = content.split(" · ").map((part) => part.trim());
  return {
    name: parts[0] ?? "",
    fields: {
      quantity: parts[1] ?? "",
      preparation: parts.slice(2).join(" · "),
    },
  };
}

function parseFitnessContent(content: string): ParsedItemContent {
  const restMatch = content.match(/^(.+?)\s+(\d+\s*[x×]\s*.+?)(?:\s*·\s*(.+))?$/i);
  if (restMatch) {
    const name = restMatch[1].trim();
    const detailWithoutRest = restMatch[2].trim();
    const rest = restMatch[3]?.trim() ?? "";
    const setsReps = detailWithoutRest.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    return {
      name,
      fields: {
        sets: setsReps?.[1] ?? "",
        reps: setsReps?.[2] ?? detailWithoutRest,
        rest,
      },
    };
  }

  const trailingRest = content.match(/^(.+?)\s+·\s*(.+)$/);
  if (trailingRest && !/\d+\s*[x×]/.test(trailingRest[1])) {
    return {
      name: trailingRest[1].trim(),
      fields: { sets: "", reps: "", rest: trailingRest[2].trim() },
    };
  }

  return { name: content.trim(), fields: { sets: "", reps: "", rest: "" } };
}

export function itemContentPreview(
  markdown: string | null | undefined,
  schema: ItemContentSchema,
  emptyLabel: string,
  max = 2,
): string {
  const rows = markdownToItemContent(markdown, schema);
  if (rows.length === 0) return emptyLabel;
  const names = rows.slice(0, max).map((row) => row.name);
  const extra = rows.length > max ? ` +${rows.length - max}` : "";
  return names.join(", ") + extra;
}

export function formatFitnessDetail(fields: Record<string, string>): string {
  const sets = fields.sets?.trim() ?? "";
  const reps = fields.reps?.trim() ?? "";
  const rest = fields.rest?.trim() ?? "";
  const setsReps =
    sets && reps ? `${sets} × ${reps}` : reps || sets;
  if (setsReps && rest) return `${setsReps} · ${rest}`;
  return setsReps || rest;
}

export function formatNutritionDetail(fields: Record<string, string>): string {
  const quantity = fields.quantity?.trim() ?? "";
  const preparation = fields.preparation?.trim() ?? "";
  if (quantity && preparation) return `${quantity} · ${preparation}`;
  return quantity || preparation;
}

export function itemContentGridTemplate(fields: readonly { gridWidth?: string }[]): string {
  const widths = fields.map((field) => field.gridWidth ?? "90px").join(" ");
  return `1fr ${widths} 36px`;
}
