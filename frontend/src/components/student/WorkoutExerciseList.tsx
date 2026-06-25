import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import {
  formatFitnessDetail,
  formatNutritionDetail,
  parseItemContentLines,
} from "@/lib/item-content";

type WorkoutExerciseListProps = {
  contentMarkdown: string | null | undefined;
  className?: string;
};

/** Renders item content lines from markdown — text only, no HTML injection. */
export function WorkoutExerciseList({ contentMarkdown, className }: WorkoutExerciseListProps) {
  const { vocabulary: v } = useSpaceVocabulary();
  const ItemIcon = v.itemIcon;
  const items = parseItemContentLines(contentMarkdown ?? "", v.contentSchema);

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={className}>
      {items.map((item, index) => {
        const detail =
          v.contentSchema === "nutrition"
            ? formatNutritionDetail(item.fields)
            : formatFitnessDetail(item.fields);

        return (
          <li key={`${item.name}-${index}`} className="flex items-start gap-2.5">
            <ItemIcon
              className="mt-0.5 size-3.5 shrink-0 text-primary/80"
              strokeWidth={2.25}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <span className="text-sm text-foreground/90">{item.name}</span>
              {detail ? (
                <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{detail}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
