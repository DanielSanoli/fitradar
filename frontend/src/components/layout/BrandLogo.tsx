import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-extrabold tracking-tight text-foreground", className)}>
      <span
        className="size-3 shrink-0 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary))]"
        aria-hidden
      />
      <span>FitRadar</span>
    </div>
  );
}
