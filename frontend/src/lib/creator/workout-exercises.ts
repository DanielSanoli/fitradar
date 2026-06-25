import {
  itemContentPreview,
  itemContentToMarkdown,
  markdownToItemContent,
  newItemContentRow,
  type ItemContentRow,
} from "@/lib/item-content";
import { getSpaceVocabulary } from "@/lib/space/vocabulary";
import type { SpaceCategory } from "@/lib/api/domain-types";
import { DEFAULT_SPACE_CATEGORY, normalizeSpaceCategory } from "@/lib/creator/space-categories";

export type WorkoutExerciseRow = ItemContentRow;

export function newExerciseRow(category?: SpaceCategory | string | null): ItemContentRow {
  const schema = getSpaceVocabulary(category ?? DEFAULT_SPACE_CATEGORY).contentSchema;
  return newItemContentRow(schema);
}

export function exercisesToMarkdown(
  exercises: ItemContentRow[],
  category?: SpaceCategory | string | null,
): string {
  const schema = getSpaceVocabulary(category ?? DEFAULT_SPACE_CATEGORY).contentSchema;
  return itemContentToMarkdown(exercises, schema);
}

export function markdownToExercises(
  markdown: string | null | undefined,
  category?: SpaceCategory | string | null,
): ItemContentRow[] {
  const schema = getSpaceVocabulary(category ?? DEFAULT_SPACE_CATEGORY).contentSchema;
  return markdownToItemContent(markdown, schema);
}

export function exercisePreview(
  markdown: string | null | undefined,
  category?: SpaceCategory | string | null,
  max = 2,
): string {
  const vocab = getSpaceVocabulary(normalizeSpaceCategory(category ?? DEFAULT_SPACE_CATEGORY));
  return itemContentPreview(markdown, vocab.contentSchema, vocab.emptyContentPreview, max);
}
