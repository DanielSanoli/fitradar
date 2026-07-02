/**
 * V1 — parser client-side de `Workout.contentMarkdown`.
 *
 * V2 (evolução futura): exercícios estruturados no backend (entidade WorkoutExercise
 * com sets/reps/rest/tempo/notas por série), eliminando heurística de markdown e
 * habilitando progressão automática, substituição de exercícios e analytics por movimento.
 */

export type WorkoutPlayerItem = {
  id: string;
  label: string;
  detail?: string;
  /** Título do bloco (heading) ao qual o item pertence, se houver. */
  blockTitle: string | null;
};

export type ParsedWorkoutPlayer = {
  items: WorkoutPlayerItem[];
  /** Texto livre quando não há headings nem listas reconhecíveis. */
  unstructuredProse: string | null;
};

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/** Reseta contador interno — apenas para testes determinísticos. */
export function resetWorkoutPlayerParserIds(): void {
  idCounter = 0;
}

function parseListContent(content: string): { label: string; detail?: string } {
  const setsMatch = content.match(/^(.+?)\s+(\d+\s*[x×]\s*.+?)(?:\s*·\s*(.+))?$/i);
  if (setsMatch) {
    return {
      label: setsMatch[1].trim(),
      detail: [setsMatch[2].trim(), setsMatch[3]?.trim()].filter(Boolean).join(" · ") || undefined,
    };
  }
  const trailing = content.match(/^(.+?)\s+·\s*(.+)$/);
  if (trailing && !/\d+\s*[x×]/.test(trailing[1])) {
    return { label: trailing[1].trim(), detail: trailing[2].trim() };
  }
  return { label: content.trim() };
}

function indentLevel(raw: string): number {
  const leading = raw.match(/^(\s*)/)?.[1] ?? "";
  return Math.floor(leading.replace(/\t/g, "  ").length / 2);
}

/**
 * Converte markdown de treino em itens navegáveis (headings = blocos, listas = exercícios).
 * Markdown sem estrutura clara vira um único passo com prose.
 */
export function parseWorkoutMarkdownToSteps(markdown: string | null | undefined): ParsedWorkoutPlayer {
  if (!markdown?.trim()) {
    return { items: [], unstructuredProse: null };
  }

  const items: WorkoutPlayerItem[] = [];
  let blockTitle: string | null = null;
  let hasStructure = false;
  const proseLines: string[] = [];

  for (const raw of markdown.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const heading = trimmed.match(/^#{1,6}\s+(.+)/);
    if (heading) {
      hasStructure = true;
      blockTitle = heading[1].trim();
      continue;
    }

    const bullet = raw.match(/^(\s*)[-*•]\s+(.+)/);
    const numbered = raw.match(/^(\s*)\d+[.)]\s+(.+)/);
    const listContent = bullet?.[2] ?? numbered?.[2];
    if (listContent) {
      hasStructure = true;
      const depth = indentLevel(raw);
      const parsed = parseListContent(listContent);
      const prefix = depth > 0 ? "↳ " : "";
      items.push({
        id: nextId("item"),
        label: `${prefix}${parsed.label}`,
        detail: parsed.detail,
        blockTitle,
      });
      continue;
    }

    proseLines.push(trimmed);
  }

  if (!hasStructure && items.length === 0) {
    const prose = proseLines.length > 0 ? proseLines.join("\n") : markdown.trim();
    return {
      items: [
        {
          id: nextId("prose"),
          label: "Treino",
          detail: prose,
          blockTitle: null,
        },
      ],
      unstructuredProse: prose,
    };
  }

  if (proseLines.length > 0) {
    items.push({
      id: nextId("note"),
      label: "Observações",
      detail: proseLines.join("\n"),
      blockTitle: null,
    });
  }

  return { items, unstructuredProse: null };
}

export function countWorkoutPlayerItems(parsed: ParsedWorkoutPlayer): number {
  return parsed.items.length;
}
