import { createElement } from "react";
import { cn } from "@/lib/utils";
import {
  normalizeSpaceCategory,
  spaceCategoryIcon,
  type SpaceCategory,
} from "@/lib/creator/space-categories";

type SpaceCategoryMarkProps = {
  category?: SpaceCategory | string | null;
  primaryColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASS = {
  sm: "size-7 rounded-lg [&_svg]:size-3.5",
  md: "size-8 rounded-lg [&_svg]:size-4",
  lg: "size-[72px] rounded-[20px] [&_svg]:size-7",
} as const;

function safeAccent(color: string | null | undefined): string | undefined {
  if (!color?.trim()) return undefined;
  const c = color.trim();
  if (/^#[0-9A-Fa-f]{3,8}$/.test(c)) return c;
  return undefined;
}

export function SpaceCategoryMark({
  category,
  primaryColor,
  size = "md",
  className,
}: SpaceCategoryMarkProps) {
  const normalized = normalizeSpaceCategory(category ?? null);
  const icon = spaceCategoryIcon(normalized);
  const accent = safeAccent(primaryColor);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border",
        SIZE_CLASS[size],
        className,
      )}
      style={
        accent
          ? { borderColor: `${accent}55`, backgroundColor: `${accent}22`, color: accent }
          : undefined
      }
      aria-hidden
    >
      {createElement(icon, { "aria-hidden": true })}
    </div>
  );
}
