import { Check, Lock } from "lucide-react";
import { FitnessIcon } from "@/components/fitness/FitnessIcon";
import { SpaceCategoryMark } from "@/components/fitness/SpaceCategoryMark";
import { cn } from "@/lib/utils";
import type { SpaceCategory } from "@/lib/api/domain-types";
import {
  foregroundOnAccent,
  rgbaHex,
} from "@/lib/creator/space-theme";
import { spaceCategoryLabel, normalizeSpaceCategory } from "@/lib/creator/space-categories";

type SpaceLivePreviewProps = {
  accent: string;
  fullLink: string;
  displayName: string;
  displayBio: string;
  category: SpaceCategory;
  logoPreview?: string | null;
  programName: string;
  programDesc: string;
  programWeeks: string;
  memberCount: number;
  showProgram: boolean;
  published: boolean;
  copied: boolean;
  onCopy: () => void;
  className?: string;
};

export function SpaceLivePreview({
  accent,
  fullLink,
  displayName,
  displayBio,
  category,
  logoPreview,
  programName,
  programDesc,
  programWeeks,
  memberCount,
  showProgram,
  published,
  copied,
  onCopy,
  className,
}: SpaceLivePreviewProps) {
  const accentFg = foregroundOnAccent(accent);
  const accentSoft = rgbaHex(accent, 0.16);
  const accentBorder = rgbaHex(accent, 0.4);
  const areaLabel = spaceCategoryLabel(normalizeSpaceCategory(category));
  const displayProgram = programName.trim() || "Seu primeiro programa";
  const weeksLabel = programWeeks === "0" ? "Contínuo" : `${programWeeks} semanas`;
  const displayProgramSub = programDesc.trim() || weeksLabel;
  const programPill = programWeeks === "0" ? "∞" : programWeeks;

  return (
    <div className={cn("sticky top-16 w-full max-w-[640px]", className)}>
      <div className="mb-3.5 flex items-center gap-2">
        <span className="relative size-2">
          <span className="absolute inset-0 rounded-full bg-primary" />
          <span className="absolute -inset-0.5 rounded-full border border-primary/50" />
        </span>
        <span className="text-[12.5px] font-bold tracking-wider text-foreground/85 uppercase">
          Pré-visualização ao vivo
        </span>
        <span className="text-xs text-muted-foreground">como seus alunos veem</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-[hsl(215_22%_9%)] shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
        <div className="flex h-[42px] items-center gap-2 border-b border-border bg-secondary/50 px-3.5">
          <span className="size-[11px] rounded-full bg-red-400/80" />
          <span className="size-[11px] rounded-full bg-amber-400/80" />
          <span className="size-[11px] rounded-full bg-emerald-400/80" />
          <div className="ml-2 flex h-[26px] flex-1 items-center gap-2 overflow-hidden rounded-md bg-background/60 px-3 font-mono text-xs text-muted-foreground">
            <Lock className="size-2.5 shrink-0 text-primary" strokeWidth={2.2} />
            <span className="truncate">{fullLink}</span>
          </div>
        </div>

        <div className="relative">
          <div
            className="h-[104px]"
            style={{
              background: `linear-gradient(125deg, ${rgbaHex(accent, 0.55)}, ${rgbaHex(accent, 0.12)} 60%, hsl(215 22% 11%))`,
            }}
          />
          <div className="-mt-[34px] flex flex-col px-7 pb-7">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt=""
                  className="size-[72px] rounded-[20px] border-[3px] border-[hsl(215_22%_9%)] object-cover shadow-lg"
                  style={{ boxShadow: `0 10px 26px ${rgbaHex(accent, 0.35)}` }}
                />
                <span className="absolute -bottom-1 -right-1 rounded-lg border border-[hsl(215_22%_9%)] bg-card p-0.5">
                  <SpaceCategoryMark category={category} primaryColor={accent} size="sm" />
                </span>
              </div>
            ) : (
              <SpaceCategoryMark category={category} primaryColor={accent} size="lg" />
            )}

            <div className="mt-4 flex items-start justify-between gap-3.5">
              <div className="min-w-0">
                <h2 className="text-[23px] font-extrabold tracking-tight text-balance">
                  {displayName}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <span
                    className="size-[7px] rounded-full"
                    style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                  />
                  {areaLabel} · Espaço no FitRadar · {memberCount} aluno{memberCount === 1 ? "" : "s"}
                </div>
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="h-[42px] shrink-0 rounded-[11px] px-5 text-sm font-bold"
                style={{
                  background: accent,
                  color: accentFg,
                  boxShadow: `0 6px 18px ${rgbaHex(accent, 0.3)}`,
                }}
              >
                Entrar no espaço
              </button>
            </div>

            <p className="mt-4 text-[14.5px] leading-relaxed text-foreground/85">{displayBio}</p>

            {showProgram ? (
              <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="mb-2.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  Programas
                </p>
                <div className="flex items-center gap-3.5 rounded-[14px] border border-border bg-card/90 p-4">
                  <div
                    className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] border"
                    style={{
                      color: accent,
                      background: accentSoft,
                      borderColor: accentBorder,
                    }}
                  >
                    <FitnessIcon context="programs" className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold">{displayProgram}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">{displayProgramSub}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold"
                    style={{
                      color: accent,
                      background: accentSoft,
                      borderColor: accentBorder,
                    }}
                  >
                    {programPill} sem
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex items-center gap-1.5 border-t border-border pt-4 text-[11.5px] text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              Powered by FitRadar
            </div>
          </div>

          {published ? (
            <div
              className="absolute right-3.5 bottom-3.5 left-3.5 flex animate-in zoom-in-95 items-center gap-3 rounded-[13px] border p-3.5 backdrop-blur-md duration-300"
              style={{
                background: rgbaHex(accent, 0.22),
                borderColor: accentBorder,
              }}
            >
              <span
                className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: accent, color: accentFg }}
              >
                <Check className="size-[18px]" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">Espaço publicado e no ar</p>
                <p className="text-xs text-foreground/75">Já pode receber alunos pelo link acima.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className="mt-3.5 flex h-[42px] w-full items-center justify-center gap-2 rounded-[11px] border border-border bg-card text-[13.5px] font-semibold transition-colors hover:bg-secondary"
      >
        {copied ? "✓ Link copiado" : "Copiar link do espaço"}
      </button>
    </div>
  );
}
