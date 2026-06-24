import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SkipLink } from "@/components/layout/SkipLink";
import { SpaceCategoryMark } from "@/components/fitness/SpaceCategoryMark";
import { FitnessIcon } from "@/components/fitness/FitnessIcon";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { publicSpaceApi } from "@/lib/api/public-space-api";
import type { CreatorSpaceResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import {
  foregroundOnAccent,
  normalizeAccentColor,
  rgbaHex,
} from "@/lib/creator/space-theme";
import { normalizeSpaceCategory, spaceCategoryLabel } from "@/lib/creator/space-categories";

export function PublicSpacePage() {
  const { slug } = useParams<{ slug: string }>();
  const [space, setSpace] = useState<CreatorSpaceResponse | null>(null);
  const [state, setState] = useState<"loading" | "error" | "not-found" | "content">("loading");
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    if (!slug?.trim()) {
      setState("not-found");
      return;
    }
    setState("loading");
    setError(undefined);
    try {
      const data = await publicSpaceApi.getBySlug(slug);
      setSpace(data);
      setState("content");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setState("not-found");
        return;
      }
      setError(e instanceof ApiError ? e.message : "Não foi possível carregar este espaço.");
      setState("error");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state !== "content" || !space) {
    return (
      <div className="flex min-h-screen flex-col bg-[radial-gradient(1100px_560px_at_82%_-14%,hsl(165_40%_12%),hsl(215_28%_7%)_56%)] text-foreground">
        <SkipLink />
        <main id="main-content" className="mx-auto w-full max-w-lg flex-1 px-4 py-16">
          <PanelState
            state={state === "not-found" ? "empty" : state === "error" ? "error" : "loading"}
            title={state === "not-found" ? "Espaço não encontrado" : undefined}
            message={
              state === "not-found"
                ? "Este link não existe ou o criador ainda não publicou o espaço."
                : error
            }
            onRetry={state === "error" ? load : undefined}
            emptyVariant="student"
            iconContext="space"
          />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Entrar no FitRadar
            </Link>
          </p>
        </main>
      </div>
    );
  }

  const accent = normalizeAccentColor(space.primaryColor);
  const accentFg = foregroundOnAccent(accent);
  const accentSoft = rgbaHex(accent, 0.16);
  const accentBorder = rgbaHex(accent, 0.4);
  const displayBio =
    space.bio?.trim() || "Bem-vindo ao espaço do seu coach. Entre para acessar treinos e check-ins.";
  const areaLabel = spaceCategoryLabel(normalizeSpaceCategory(space.category));

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(1100px_560px_at_82%_-14%,hsl(165_40%_12%),hsl(215_28%_7%)_56%)] text-foreground">
      <SkipLink />
      <main id="main-content" className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
        <div className="overflow-hidden rounded-2xl border border-border bg-[hsl(215_22%_9%)] shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
          <div
            className="h-[104px]"
            style={{
              background: `linear-gradient(125deg, ${rgbaHex(accent, 0.55)}, ${rgbaHex(accent, 0.12)} 60%, hsl(215 22% 11%))`,
            }}
            aria-hidden
          />
          <div className="-mt-[34px] flex flex-col px-6 pb-7 md:px-7">
            {space.logoUrl ? (
              <div className="relative">
                <img
                  src={space.logoUrl}
                  alt=""
                  width={72}
                  height={72}
                  className="size-[72px] rounded-[20px] border-[3px] border-[hsl(215_22%_9%)] object-cover shadow-lg"
                  style={{ boxShadow: `0 10px 26px ${rgbaHex(accent, 0.35)}` }}
                />
                <span className="absolute -bottom-1 -right-1 rounded-lg border border-[hsl(215_22%_9%)] bg-card p-0.5">
                  <SpaceCategoryMark category={space.category} primaryColor={accent} size="sm" />
                </span>
              </div>
            ) : (
              <SpaceCategoryMark category={space.category} primaryColor={accent} size="lg" />
            )}

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-[23px] font-extrabold tracking-tight text-balance">{space.name}</h1>
                <div className="mt-1 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <span
                    className="size-[7px] rounded-full"
                    style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                    aria-hidden
                  />
                  Espaço no FitRadar · {areaLabel}
                </div>
              </div>
              <Button
                asChild
                className="h-[42px] shrink-0 rounded-[11px] px-5 text-sm font-bold shadow-[0_6px_18px_var(--btn-shadow)]"
                style={
                  {
                    background: accent,
                    color: accentFg,
                    "--btn-shadow": rgbaHex(accent, 0.3),
                  } as React.CSSProperties
                }
              >
                <Link to="/login" state={{ from: "/student" }}>
                  Entrar no espaço
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-[14.5px] leading-relaxed text-foreground/85">{displayBio}</p>

            <div
              className="mt-5 rounded-[14px] border border-border bg-card/90 p-4"
              style={{ borderColor: accentBorder, background: accentSoft }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] border"
                  style={{
                    color: accent,
                    background: rgbaHex(accent, 0.12),
                    borderColor: accentBorder,
                  }}
                >
                  <FitnessIcon context="students" className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold">Como entrar</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Se você recebeu convite do seu coach, use o e-mail e a senha enviados para fazer
                    login. Novos alunos entram somente por convite.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3 h-9 rounded-[9px]"
                  >
                    <Link to="/login" state={{ from: "/student" }}>
                      Já tenho conta — entrar
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1.5 border-t border-border pt-4 text-[11.5px] text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              Powered by{" "}
              <Link to="/" className="font-semibold text-foreground/80 hover:text-primary">
                FitRadar
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
