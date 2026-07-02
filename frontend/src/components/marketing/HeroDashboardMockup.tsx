import { Activity, CalendarCheck, HeartPulse, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const MINI_INSIGHTS = [
  { label: "Alunos ativos", value: "128", icon: Users, tone: "text-primary" },
  { label: "Aderência", value: "78%", icon: HeartPulse, tone: "text-primary" },
  { label: "Em risco", value: "3", icon: Activity, tone: "text-[hsl(0_82%_80%)]" },
  { label: "Check-ins", value: "42", icon: CalendarCheck, tone: "text-primary" },
] as const;

type HeroDashboardMockupProps = {
  className?: string;
};

export function HeroDashboardMockup({ className }: HeroDashboardMockupProps) {
  return (
    <div
      className={cn(
        "landing-mockup relative mx-auto w-full max-w-[420px] motion-safe:animate-fade-in-up",
        className,
      )}
      style={{ animationDelay: "180ms" }}
      aria-hidden
    >
      <div className="absolute -inset-4 rounded-[28px] bg-[radial-gradient(circle,hsl(var(--primary)/0.16),transparent_70%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[20px] border border-border/80 bg-card/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-border/80 bg-secondary/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-[hsl(0_72%_67%/0.85)]" />
          <span className="size-2.5 rounded-full bg-[hsl(38_100%_56%/0.85)]" />
          <span className="size-2.5 rounded-full bg-[hsl(var(--primary)/0.85)]" />
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">app.fitradar · Radar</span>
        </div>

        <div className="space-y-4 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-foreground">
                Painel do criador
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Insights do Radar · ao vivo</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 motion-safe:animate-ping rounded-full bg-primary opacity-40" />
                <span className="relative size-1.5 rounded-full bg-primary" />
              </span>
              Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {MINI_INSIGHTS.map((item, index) => (
              <div
                key={item.label}
                className="rounded-[12px] border border-border/80 bg-gradient-to-br from-secondary/50 to-card p-3 motion-safe:animate-fade-in-up"
                style={{ animationDelay: `${240 + index * 70}ms` }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {item.label}
                  </span>
                  <item.icon className={cn("size-3.5 opacity-80", item.tone)} />
                </div>
                <p className={cn("font-display text-2xl font-extrabold leading-none tracking-tight", item.tone)}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[12px] border border-[hsl(var(--risk-high)/0.28)] bg-[hsl(var(--risk-high)/0.08)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[hsl(0_82%_80%)]">
              Atenção hoje
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              3 alunos com sinais de queda — lembrete sugerido pelo copiloto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
