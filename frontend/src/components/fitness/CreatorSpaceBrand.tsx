import { cn } from "@/lib/utils";

export type CreatorSpaceBrandProps = {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  className?: string;
};

function spaceInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function safeAccent(color: string | null | undefined): string | undefined {
  if (!color?.trim()) return undefined;
  const c = color.trim();
  if (/^#[0-9A-Fa-f]{3,8}$/.test(c)) return c;
  return undefined;
}

/** Creator space branding from existing DTO fields (logoUrl, primaryColor, name). */
export function CreatorSpaceBrand({
  name,
  logoUrl,
  primaryColor,
  className,
}: CreatorSpaceBrandProps) {
  const accent = safeAccent(primaryColor);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
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
        <div
          className="flex size-8 items-center justify-center rounded-lg border text-xs font-bold"
          style={
            accent
              ? { borderColor: `${accent}55`, backgroundColor: `${accent}22`, color: accent }
              : undefined
          }
          aria-hidden
        >
          {spaceInitials(name)}
        </div>
      )}
      <span className="truncate text-xs font-medium text-muted-foreground">{name}</span>
    </div>
  );
}
