import { cn } from "@/lib/utils";
import { SpaceCategoryMark } from "@/components/fitness/SpaceCategoryMark";
import {
  normalizeSpaceCategory,
  spaceCategoryLabel,
  type SpaceCategory,
} from "@/lib/creator/space-categories";

export type CreatorSpaceBrandProps = {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  category?: SpaceCategory | string | null;
  showAreaLabel?: boolean;
  className?: string;
};

/** Creator space branding from API fields (logo, color, name, area category). */
export function CreatorSpaceBrand({
  name,
  logoUrl,
  primaryColor,
  category,
  showAreaLabel = false,
  className,
}: CreatorSpaceBrandProps) {
  const normalizedCategory = normalizeSpaceCategory(category ?? null);

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div className="relative shrink-0">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            width={32}
            height={32}
            loading="lazy"
            decoding="async"
            className="size-8 rounded-lg border border-border object-cover"
          />
        ) : (
          <SpaceCategoryMark category={normalizedCategory} primaryColor={primaryColor} size="md" />
        )}
        {logoUrl ? (
          <span className="absolute -bottom-1 -right-1 rounded-md border border-background bg-card p-0.5 shadow-sm">
            <SpaceCategoryMark
              category={normalizedCategory}
              primaryColor={primaryColor}
              size="sm"
              className="!size-5 !rounded-md border-border bg-card"
            />
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <span className="block truncate text-xs font-medium text-muted-foreground">{name}</span>
        {showAreaLabel ? (
          <span className="block truncate text-[10px] text-muted-foreground/80">
            {spaceCategoryLabel(normalizedCategory)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
