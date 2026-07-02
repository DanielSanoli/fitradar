import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Share2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PoweredByFitRadar } from "@/components/student/PoweredByFitRadar";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { memberApi } from "@/lib/api/member-api";
import type { MonthlyRecapResult } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import {
  drawMonthlyRecapStory,
  shareMonthlyRecapPng,
  STORY_HEIGHT,
  STORY_WIDTH,
} from "@/lib/student/monthly-recap-canvas";
import { cn } from "@/lib/utils";

function previousClosedMonth(): { year: number; month: number } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function StudentMonthlyRecapPage() {
  const [searchParams] = useSearchParams();
  const defaults = useMemo(() => previousClosedMonth(), []);
  const year = Number(searchParams.get("year") ?? defaults.year);
  const month = Number(searchParams.get("month") ?? defaults.month);

  const [recap, setRecap] = useState<MonthlyRecapResult | null>(null);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [sharing, setSharing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setState("loading");
    setError(undefined);
    try {
      const data = await memberApi.myRecap(year, month);
      setRecap(data);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar retrospectiva.");
      setState("error");
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!recap?.hasData || !canvasRef.current) return;
    void drawMonthlyRecapStory(canvasRef.current, recap);
  }, [recap]);

  const handleShare = async () => {
    if (!recap?.hasData) return;
    setSharing(true);
    try {
      const outcome = await shareMonthlyRecapPng(recap);
      toast(outcome === "shared" ? "Card compartilhado!" : "PNG baixado.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Não foi possível compartilhar.", "error");
    } finally {
      setSharing(false);
    }
  };

  const previewScale = 0.28;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 md:pb-8">
      <header className="flex items-center gap-3 px-1 pt-1">
        <Button variant="outline" size="sm" asChild className="h-9 rounded-[9px]">
          <Link to="/student/progress">
            <ChevronLeft className="size-4" aria-hidden />
            Voltar
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold tracking-tight">
            Sua retrospectiva{recap ? ` de ${recap.monthLabel}` : ""}
          </h1>
        </div>
      </header>

      <PanelState state={state} message={error} onRetry={load} emptyVariant="student">
        {recap && !recap.hasData ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <h2 className="text-lg font-bold">Sem treinos neste mês</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Quando você registrar check-ins, sua retrospectiva aparecerá aqui com números e um
              card para compartilhar.
            </p>
          </div>
        ) : null}

        {recap?.hasData ? (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-lg">
              <div
                className="mx-auto origin-top"
                style={{
                  width: STORY_WIDTH * previewScale,
                  height: STORY_HEIGHT * previewScale,
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={STORY_WIDTH}
                  height={STORY_HEIGHT}
                  className={cn("rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.35)]")}
                  style={{
                    width: STORY_WIDTH * previewScale,
                    height: STORY_HEIGHT * previewScale,
                  }}
                  aria-label={`Retrospectiva visual de ${recap.monthLabel}`}
                />
              </div>
            </div>

            <Button
              size="lg"
              className="h-12 gap-2 rounded-[12px] font-bold"
              loading={sharing}
              onClick={() => void handleShare()}
            >
              <Share2 className="size-4" aria-hidden />
              Compartilhar retrospectiva
            </Button>

            <PoweredByFitRadar className="text-center" />

            <p className="text-center text-[11px] text-muted-foreground">
              Sugestão, não orientação médica/profissional.
            </p>
          </>
        ) : null}
      </PanelState>
    </div>
  );
}
