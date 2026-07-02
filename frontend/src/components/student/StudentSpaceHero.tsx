import { SpaceCategoryMark } from "@/components/fitness/SpaceCategoryMark";
import type { CreatorSpaceResponse } from "@/lib/api/domain-types";
import {
  normalizeSpaceCategory,
  spaceCategoryLabel,
} from "@/lib/creator/space-categories";
import { spaceModulesSummary } from "@/lib/creator/space-modules";
import { normalizeAccentColor, rgbaHex } from "@/lib/creator/space-theme";
import { cn } from "@/lib/utils";

type StudentSpaceHeroProps = {
  space: CreatorSpaceResponse;
  className?: string;
};

/** Branded space header — aligned with the creator SpaceBuilder live preview. */
export function StudentSpaceHero({ space, className }: StudentSpaceHeroProps) {
  const accent = normalizeAccentColor(space.primaryColor);
  const category = normalizeSpaceCategory(space.category);
  const areaLabel = spaceCategoryLabel(category);
  const modulesLabel = spaceModulesSummary(space.modules ?? []);
  const bio =
    space.bio?.trim() ||
    "Bem-vindo ao seu espaço de acompanhamento — conteúdo, check-ins e progresso em um só lugar.";

  return (
    <section
      aria-labelledby="student-space-name"
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_28px_rgba(0,0,0,0.32)]",
        className,
      )}
    >
      <div
        className="h-[72px]"
        style={{
          background: `linear-gradient(125deg, ${rgbaHex(accent, 0.55)}, ${rgbaHex(accent, 0.12)} 60%, hsl(var(--card)))`,
        }}
        aria-hidden
      />

      <div className="relative px-4 pb-4 pt-0">
        <div className="-mt-9 flex items-end gap-3">
          {space.logoUrl ? (
            <div className="relative shrink-0">
              <img
                src={space.logoUrl}
                alt=""
                width={72}
                height={72}
                loading="eager"
                decoding="async"
                className="size-[72px] rounded-[18px] border-[3px] border-card object-cover shadow-lg"
                style={{ boxShadow: `0 10px 26px ${rgbaHex(accent, 0.35)}` }}
              />
              <span className="absolute -bottom-1 -right-1 rounded-lg border border-card bg-card p-0.5">
                <SpaceCategoryMark category={category} primaryColor={accent} size="sm" />
              </span>
            </div>
          ) : (
            <SpaceCategoryMark category={category} primaryColor={accent} size="lg" className="-mt-1" />
          )}

          <div className="min-w-0 flex-1 pb-1">
            <h1
              id="student-space-name"
              className="truncate text-[22px] font-extrabold leading-tight tracking-tight"
            >
              {space.name}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
              <span
                className="size-[7px] shrink-0 rounded-full"
                style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                aria-hidden
              />
              <span className="truncate">{areaLabel} · {modulesLabel}</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{bio}</p>
      </div>
    </section>
  );
}
