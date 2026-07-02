import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { SpaceModule } from "@/lib/api/domain-types";
import { Button } from "@/components/ui/button";
import { spaceModuleLabel } from "@/lib/creator/space-modules";
import { cn } from "@/lib/utils";

type CreatorModuleRequiredPromptProps = {
  module: SpaceModule;
  className?: string;
  compact?: boolean;
};

export function CreatorModuleRequiredPrompt({
  module,
  className,
  compact = false,
}: CreatorModuleRequiredPromptProps) {
  const label = spaceModuleLabel(module);
  const message = `Ative o módulo ${label} nas configurações do seu espaço para continuar.`;

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-primary/25 bg-primary/8 px-4 py-3",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button size="sm" className="h-9 rounded-[9px]" asChild>
          <Link to="/app/space">Configurar espaço</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 rounded-[14px] border border-dashed border-primary/30 bg-primary/5 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-[52px] items-center justify-center rounded-[14px] border border-primary/30 bg-primary/10">
        <Sparkles className="size-6 text-primary" strokeWidth={2} aria-hidden />
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight">Módulo {label} desativado</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>
      </div>
      <Button size="lg" className="h-[46px] gap-2 rounded-[11px] px-7" asChild>
        <Link to="/app/space">
          <Sparkles className="size-4" strokeWidth={2.5} aria-hidden />
          Abrir Space Builder
        </Link>
      </Button>
    </div>
  );
}
