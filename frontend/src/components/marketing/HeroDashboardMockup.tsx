import { Activity, Bell, HeartPulse, Radar } from "lucide-react";
import { cn } from "@/lib/utils";

const FLOATING_CARDS = [
  {
    label: "Aluno em risco",
    detail: "Sinal detectado",
    icon: Activity,
    className: "-left-2 top-8 md:-left-12",
    floatClass: "landing-float-soft",
    tone: "border-[hsl(var(--risk-high)/0.35)] bg-[hsl(var(--risk-high)/0.12)]",
    iconTone: "text-[hsl(0_82%_80%)]",
  },
  {
    label: "Lembrete enviado",
    detail: "Nudge sugerido",
    icon: Bell,
    className: "-right-1 top-[42%] md:-right-10",
    floatClass: "landing-float-soft-delayed",
    tone: "border-primary/35 bg-primary/10",
    iconTone: "text-primary",
  },
  {
    label: "Aderência",
    detail: "via motor",
    icon: HeartPulse,
    className: "-bottom-3 left-4 md:-bottom-5 md:left-0",
    floatClass: "landing-float-soft",
    tone: "border-border/80 bg-card/95",
    iconTone: "text-primary",
    showBar: true,
  },
] as const;

type HeroDashboardMockupProps = {
  className?: string;
};

export function HeroDashboardMockup({ className }: HeroDashboardMockupProps) {
  return (
    <div
      className={cn(
        "landing-mockup relative mx-auto w-full max-w-[440px] motion-safe:animate-fade-in-up",
        className,
      )}
      style={{ animationDelay: "180ms" }}
      aria-hidden
    >
      <div className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle,hsl(var(--primary)/0.2),transparent_68%)] blur-3xl" />

      {FLOATING_CARDS.map((card, index) => (
        <div
          key={card.label}
          className={cn(
            "absolute z-20 hidden min-w-[148px] rounded-[13px] border px-3 py-2.5 shadow-[0_14px_36px_rgba(0,0,0,0.38)] backdrop-blur-md motion-safe:animate-fade-in-up sm:block",
            card.tone,
            card.className,
            card.floatClass,
          )}
          style={{ animationDelay: `${320 + index * 90}ms` }}
        >
          <div className="flex items-center gap-2.5">
            <card.icon className={cn("size-3.5 shrink-0", card.iconTone)} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {card.label}
              </p>
              <p className="font-display text-sm font-bold tracking-tight text-foreground">{card.detail}</p>
              {"showBar" in card && card.showBar ? (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/50">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary/70 to-primary" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}

      <div className="relative overflow-hidden rounded-[22px] border border-border/80 bg-card/95 shadow-[0_28px_88px_rgba(0,0,0,0.48)] backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-border/80 bg-secondary/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-[hsl(0_72%_67%/0.85)]" />
          <span className="size-2.5 rounded-full bg-[hsl(38_100%_56%/0.85)]" />
          <span className="size-2.5 rounded-full bg-[hsl(var(--primary)/0.85)]" />
          <span className="ml-2 font-mono text-[11px] tracking-tight text-muted-foreground">
            app.fitradar · radar
          </span>
        </div>

        <div className="space-y-4 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-foreground">
                Painel do criador
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                retenção · hoje
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <Radar className="size-3" aria-hidden />
              Live
            </span>
          </div>

          <div className="space-y-2.5 sm:hidden">
            {FLOATING_CARDS.map((card) => (
              <div
                key={card.label}
                className={cn("flex items-center gap-3 rounded-[12px] border px-3 py-2.5", card.tone)}
              >
                <card.icon className={cn("size-4", card.iconTone)} />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="font-display text-sm font-bold">{card.detail}</p>
                  {"showBar" in card && card.showBar ? (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/50">
                      <div className="h-full w-[72%] rounded-full bg-primary/80" />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[12px] border border-[hsl(var(--risk-high)/0.28)] bg-[hsl(var(--risk-high)/0.08)] p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[hsl(0_82%_80%)]">
              Atenção hoje
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Alunos com queda de engajamento — copiloto sugere mensagem personalizada.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {["Check-ins", "Programas", "Ranking", "Digest"].map((label) => (
              <div
                key={label}
                className="rounded-[12px] border border-border/80 bg-gradient-to-br from-secondary/50 to-card p-3"
              >
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {label}
                </p>
                <div className="mt-2 h-2 rounded-full bg-muted/60">
                  <div className="h-full w-2/3 rounded-full bg-primary/35" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
