import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardList, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CreatorSpaceBrand } from "@/components/fitness/CreatorSpaceBrand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PanelState } from "@/components/ui/PanelState";
import { useToast } from "@/components/ui/toast";
import { memberApi } from "@/lib/api/member-api";
import type { CreatorSpaceResponse, StudentProgramResponse } from "@/lib/api/domain-types";
import { ApiError } from "@/lib/api/types";
import { startProgramCheckout } from "@/lib/billing/start-program-checkout";
import { PROGRAM_ACCENT_BARS } from "@/lib/creator/display-utils";
import { canEnrollFree, canPurchasePaid, programPriceLabel } from "@/lib/student/program-catalog";
import { cn } from "@/lib/utils";

export function StudentProgramsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<StudentProgramResponse[]>([]);
  const [space, setSpace] = useState<CreatorSpaceResponse | null>(null);
  const [state, setState] = useState<"loading" | "error" | "content">("loading");
  const [error, setError] = useState<string>();
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [catalog, spaceResult] = await Promise.all([
        memberApi.myPrograms(),
        memberApi.mySpace().catch(() => null),
      ]);
      setPrograms(catalog);
      setSpace(spaceResult);
      setState("content");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao carregar programas.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enrolledCount = programs.filter((p) => p.enrolled).length;
  const subtitle =
    programs.length === 0
      ? "Seu coach ainda não publicou programas neste espaço."
      : enrolledCount > 0
        ? `${programs.length} programas · ${enrolledCount} matriculado(s)`
        : `${programs.length} programa(s) disponível(is)`;

  const handleEnroll = async (program: StudentProgramResponse) => {
    if (!canEnrollFree(program)) return;
    setEnrollingId(program.id);
    try {
      await memberApi.enrollProgram(program.id);
      toast("Matrícula confirmada! Seus treinos já estão na home.");
      navigate("/student");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível matricular.", "error");
    } finally {
      setEnrollingId(null);
    }
  };

  const handlePurchase = async (program: StudentProgramResponse) => {
    if (!canPurchasePaid(program)) return;
    setPurchasingId(program.id);
    try {
      const result = await startProgramCheckout(program.id);
      if (!result.ok) {
        toast(result.error ?? "Não foi possível iniciar a compra.", "error");
        return;
      }
      if (result.redirected) return;
      toast(result.message ?? "Compra iniciada — aguarde a confirmação.");
      void load();
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 motion-safe:animate-in motion-safe:fade-in md:pb-8">
      <header className="px-1 pt-1">
        {space ? (
          <CreatorSpaceBrand
            name={space.name}
            logoUrl={space.logoUrl}
            primaryColor={space.primaryColor}
            category={space.category}
            className="mb-3"
          />
        ) : null}
        <h1 className="text-[23px] font-extrabold tracking-tight">Programas</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>

      <PanelState
        state={state === "content" && programs.length === 0 ? "empty" : state}
        message={error}
        onRetry={load}
        emptyVariant="student"
      >
        <ul className="flex list-none flex-col gap-3.5 p-0">
          {programs.map((program, index) => {
            const priceLabel = programPriceLabel(program);
            const enrolling = enrollingId === program.id;
            const purchasing = purchasingId === program.id;

            return (
              <li key={program.id}>
                <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                  <div
                    className="h-[3px]"
                    style={{ background: PROGRAM_ACCENT_BARS[index % PROGRAM_ACCENT_BARS.length] }}
                    aria-hidden
                  />
                  <div className="space-y-3.5 p-[18px]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-extrabold leading-tight tracking-tight">
                          {program.title}
                        </h2>
                        {program.description ? (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {program.description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                          program.paid
                            ? "border-amber-500/35 bg-amber-500/10 text-amber-400"
                            : "border-primary/35 bg-primary/10 text-primary",
                        )}
                      >
                        {priceLabel}
                      </span>
                    </div>

                    {program.purchasePending ? (
                      <Alert>
                        <AlertDescription>Pagamento pendente — aguarde a confirmação.</AlertDescription>
                      </Alert>
                    ) : null}

                    {program.enrolled ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                          <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          Matriculado
                        </span>
                        <Button asChild variant="outline" size="sm" className="rounded-[10px]">
                          <Link to="/student">Ver treinos</Link>
                        </Button>
                      </div>
                    ) : program.paid ? (
                      <Button
                        size="lg"
                        className="h-12 w-full rounded-[12px] font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)]"
                        disabled={!canPurchasePaid(program) || purchasing}
                        onClick={() => void handlePurchase(program)}
                      >
                        <CreditCard className="size-4" aria-hidden />
                        {purchasing ? "Redirecionando…" : `Comprar · ${priceLabel}`}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="h-12 w-full rounded-[12px] font-bold shadow-[0_6px_20px_hsl(var(--primary)/0.36)]"
                        disabled={!canEnrollFree(program) || enrolling}
                        onClick={() => void handleEnroll(program)}
                      >
                        <ClipboardList className="size-4" aria-hidden />
                        {enrolling ? "Matriculando…" : "Matricular grátis"}
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </PanelState>

      <p className="text-center text-[11px] text-muted-foreground">
        Sugestão, não orientação médica/profissional.
      </p>
    </div>
  );
}
