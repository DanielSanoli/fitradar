import { cn } from "@/lib/utils";

type PoweredByFitRadarProps = {
  className?: string;
};

/** Discreet platform attribution — creator brand stays primary. */
export function PoweredByFitRadar({ className }: PoweredByFitRadarProps) {
  return (
    <p className={cn("text-[10px] leading-snug text-muted-foreground/65", className)}>
      Powered by{" "}
      <span className="font-semibold tracking-tight text-muted-foreground/80">FitRadar</span>
    </p>
  );
}
