import type { LucideIcon } from "lucide-react";
import { Dumbbell, Flame, LayoutGrid, PersonStanding, Salad } from "lucide-react";
import type { SpaceCategory } from "@/lib/api/domain-types";

export type { SpaceCategory };

export const DEFAULT_SPACE_CATEGORY: SpaceCategory = "OTHER";

export const SPACE_CATEGORY_IDS = [
  "NUTRITION",
  "GYM",
  "CROSSFIT",
  "PILATES",
  "OTHER",
] as const satisfies readonly SpaceCategory[];

export type SpaceCategoryOption = {
  id: SpaceCategory;
  label: string;
  icon: LucideIcon;
};

/** Single source of truth: area label + lucide icon. Add new areas here. */
export const SPACE_CATEGORIES: readonly SpaceCategoryOption[] = [
  { id: "NUTRITION", label: "Nutrição", icon: Salad },
  { id: "GYM", label: "Academia", icon: Dumbbell },
  { id: "CROSSFIT", label: "Crossfit", icon: Flame },
  { id: "PILATES", label: "Pilates", icon: PersonStanding },
  { id: "OTHER", label: "Outro", icon: LayoutGrid },
] as const;

const CATEGORY_MAP = new Map(SPACE_CATEGORIES.map((item) => [item.id, item]));

export function normalizeSpaceCategory(value: string | null | undefined): SpaceCategory {
  if (value && CATEGORY_MAP.has(value as SpaceCategory)) {
    return value as SpaceCategory;
  }
  return DEFAULT_SPACE_CATEGORY;
}

export function spaceCategoryOption(category: SpaceCategory): SpaceCategoryOption {
  return CATEGORY_MAP.get(category) ?? CATEGORY_MAP.get(DEFAULT_SPACE_CATEGORY)!;
}

export function spaceCategoryIcon(category: SpaceCategory): LucideIcon {
  return spaceCategoryOption(category).icon;
}

export function spaceCategoryLabel(category: SpaceCategory): string {
  return spaceCategoryOption(category).label;
}
