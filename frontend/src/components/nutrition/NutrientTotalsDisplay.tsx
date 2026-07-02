import type { NutrientTotalsResponse } from "@/lib/api/domain-types";
import { cn } from "@/lib/utils";

type NutrientTotalsDisplayProps = {
  totals: NutrientTotalsResponse;
  className?: string;
  compact?: boolean;
};

export function NutrientTotalsDisplay({ totals, className, compact }: NutrientTotalsDisplayProps) {
  const items = [
    { label: "kcal", value: totals.kcal },
    { label: "P", value: `${totals.proteinaG} g` },
    { label: "C", value: `${totals.carboG} g` },
    { label: "G", value: `${totals.gorduraG} g` },
  ];

  return (
    <dl
      className={cn(
        "grid gap-2",
        compact ? "grid-cols-4 text-center" : "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-[10px] border border-border/70 bg-secondary/30 px-2.5 py-2",
            compact && "px-2 py-1.5",
          )}
        >
          <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className={cn("font-display font-bold tracking-tight text-primary", compact ? "text-sm" : "text-base")}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
