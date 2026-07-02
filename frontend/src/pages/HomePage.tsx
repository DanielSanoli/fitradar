import { Link } from "react-router-dom";
import { ArrowRight, Check, Radar, Sparkles, X } from "lucide-react";
import { HeroDashboardMockup } from "@/components/marketing/HeroDashboardMockup";
import { LandingFaq } from "@/components/marketing/LandingFaq";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  COMPARE_ROWS,
  HOW_IT_WORKS,
  LANDING_FEATURES,
  LANDING_PRO_PRICE,
  LANDING_TRIAL_DAYS,
} from "@/lib/marketing/landing-content";
import { cn } from "@/lib/utils";

const PAGE_META = {
  title: "FitRadar — Saiba quem vai desistir antes que desista",
  description:
    "Plataforma white-label para coaches e nutricionistas: Radar de retenção, área de membros com sua marca e cobrança recorrente via Asaas. 14 dias grátis, sem cartão.",
};

const HERO_TRUST = [
  `${LANDING_TRIAL_DAYS} dias grátis`,
  "Sem cartão",
  "PWA para alunos",
  "Asaas no web",
] as const;

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="insight-label">{children}</p>;
}

export function HomePage() {
  usePageMeta(PAGE_META);

  return (
    <div className="overflow-x-hidden">
      <section className="landing-hero relative border-b border-border/60">
        <div className="landing-grid-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:items-center md:gap-12 md:px-6 md:py-20 lg:py-28">
          <div className="space-y-7 text-center md:text-left">
            <p
              className="motion-safe:animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"
              style={{ animationDelay: "40ms" }}
            >
              <Sparkles className="size-3.5" aria-hidden />
              Copiloto de retenção para coaches
            </p>

            <div className="space-y-5">
              <h1
                className="font-display text-[2.65rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-foreground motion-safe:animate-fade-in-up sm:text-5xl md:text-[3.25rem] lg:text-[3.85rem]"
                style={{ animationDelay: "90ms" }}
              >
                Saiba quem vai desistir —{" "}
                <span className="bg-gradient-to-r from-primary via-[hsl(165_80%_62%)] to-[hsl(190_70%_58%)] bg-clip-text text-transparent">
                  antes que desista.
                </span>
              </h1>
              <p
                className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground motion-safe:animate-fade-in-up md:mx-0 md:text-lg md:leading-8"
                style={{ animationDelay: "140ms" }}
              >
                Não é mais uma área de membros. É o Radar que lê sinais de churn, sugere o nudge certo
                e entrega sua marca white-label — treinos, nutrição e cobrança no mesmo fluxo.
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-3 motion-safe:animate-fade-in-up sm:flex-row md:justify-start"
              style={{ animationDelay: "190ms" }}
            >
              <Button asChild size="lg" className="h-12 min-w-[210px] rounded-full px-6 text-[15px] shadow-[0_12px_40px_hsl(var(--primary)/0.28)]">
                <Link to="/register">
                  Começar grátis
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-[15px]">
                <a href="#planos">Ver planos</a>
              </Button>
            </div>

            <ul
              className="flex flex-wrap items-center justify-center gap-2 motion-safe:animate-fade-in-up md:justify-start"
              style={{ animationDelay: "240ms" }}
            >
              {HERO_TRUST.map((item) => (
                <li
                  key={item}
                  className="landing-trust-pill rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <HeroDashboardMockup className="md:justify-self-end" />
        </div>
      </section>

      <section
        id="solucao"
        className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
        aria-labelledby="compare-heading"
      >
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Problema → Solução</SectionEyebrow>
          <h2
            id="compare-heading"
            className="mt-2 font-display text-3xl font-extrabold tracking-[-0.035em] md:text-4xl"
          >
            Pare de adivinhar quem some
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground md:text-base">
            A maioria reage tarde. Com o Radar, você age com dados e automação desde o primeiro sinal.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-12 overflow-hidden rounded-[18px] border border-border/80 bg-card/50 shadow-[0_12px_48px_rgba(0,0,0,0.28)]">
          <div className="hidden border-b border-border/70 bg-secondary/35 md:grid md:grid-cols-2">
            <p className="flex items-center gap-2 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <X className="size-3.5 text-[hsl(0_72%_67%)]" aria-hidden />
              Como a maioria faz
            </p>
            <p className="flex items-center gap-2 border-l border-border/70 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
              <Check className="size-3.5" aria-hidden />
              Com FitRadar
            </p>
          </div>
          {COMPARE_ROWS.map((row, index) => (
            <div
              key={row.legacy}
              className={cn(
                "grid border-b border-border/60 last:border-b-0 md:grid-cols-2",
                index % 2 === 0 ? "bg-secondary/10" : "bg-transparent",
              )}
            >
              <div className="flex gap-3 border-b border-border/50 px-4 py-4 md:border-b-0 md:border-r md:px-6 md:py-5">
                <X className="mt-0.5 size-4 shrink-0 text-[hsl(0_72%_67%)] md:hidden" aria-hidden />
                <p className="text-sm leading-relaxed text-muted-foreground">{row.legacy}</p>
              </div>
              <div className="flex gap-3 bg-gradient-to-br from-primary/[0.07] to-transparent px-4 py-4 md:px-6 md:py-5">
                <Check className="mt-0.5 size-4 shrink-0 text-primary md:hidden" aria-hidden />
                <p className="text-sm leading-relaxed text-foreground">{row.fitradar}</p>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal delay={120} className="mt-10 text-center">
          <p className="inline-flex max-w-lg flex-col items-center gap-2 rounded-[14px] border border-dashed border-primary/30 bg-primary/[0.06] px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:text-left">
            <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
            <span>
              <strong className="font-semibold text-foreground">Novo</strong> — seja um dos primeiros
              coaches a validar o Radar com alunos reais.
            </span>
          </p>
        </Reveal>
      </section>

      <section
        id="recursos"
        className="relative border-y border-border/60 bg-secondary/20 py-16 md:py-24"
        aria-labelledby="features-heading"
      >
        <div className="landing-grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <Reveal className="text-center">
            <SectionEyebrow>Recursos</SectionEyebrow>
            <h2
              id="features-heading"
              className="mt-2 font-display text-3xl font-extrabold tracking-[-0.035em] md:text-4xl"
            >
              Radar no centro. Tudo ao redor.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] text-muted-foreground md:text-base">
              Área de membros premium, retenção inteligente e receita recorrente — sem comissão de app
              store.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 55}>
                <Card
                  className={cn(
                    "landing-card h-full border-border/80 bg-card/85",
                    index === 0 && "landing-feature-spotlight sm:col-span-2 lg:col-span-1",
                  )}
                >
                  <CardHeader className="gap-3 pb-2">
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-[12px] border border-primary/25 bg-primary/10",
                        index === 0 ? "size-12" : "size-11",
                      )}
                    >
                      <feature.icon
                        className={cn("text-primary", index === 0 ? "size-6" : "size-5")}
                        aria-hidden
                      />
                    </div>
                    <CardTitle className={cn("font-display", index === 0 ? "text-xl" : "text-lg")}>
                      {feature.title}
                      {index === 0 ? (
                        <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                          Diferencial
                        </span>
                      ) : null}
                    </CardTitle>
                    <CardDescription className="text-[14px] leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
        aria-labelledby="steps-heading"
      >
        <Reveal className="text-center">
          <SectionEyebrow>Como funciona</SectionEyebrow>
          <h2 id="steps-heading" className="mt-2 font-display text-3xl font-extrabold tracking-[-0.035em] md:text-4xl">
            Três passos até o primeiro nudge
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground md:text-base">
            Do convite ao check-in — o Radar entra em ação sozinho.
          </p>
        </Reveal>

        <div className="landing-step-track relative mt-12 grid gap-5 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, index) => (
            <Reveal key={item.title} delay={index * 85}>
              <Card className="landing-card relative z-[1] h-full border-border/80 bg-card/90 text-left">
                <CardHeader className="gap-4">
                  <span className="inline-flex size-11 items-center justify-center rounded-full border border-primary/35 bg-primary/10 font-display text-lg font-extrabold text-primary">
                    {item.step}
                  </span>
                  <CardTitle className="font-display text-lg">{item.title}</CardTitle>
                  <CardDescription className="text-[14px] leading-relaxed">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id="planos"
        className="relative border-y border-border/60 bg-secondary/20 py-16 md:py-24"
        aria-labelledby="pricing-heading"
      >
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <Reveal className="text-center">
            <SectionEyebrow>Preços</SectionEyebrow>
            <h2 id="pricing-heading" className="mt-2 font-display text-3xl font-extrabold tracking-[-0.035em] md:text-4xl">
              Comece grátis. Escale no Pro.
            </h2>
            <p className="mt-4 text-[15px] text-muted-foreground md:text-base">
              Cobrança digital no web (Asaas) — sem taxa de loja de apps.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 md:items-stretch">
            <Reveal delay={60}>
              <Card className="landing-card h-full border-border/80 bg-card/85">
                <CardHeader className="gap-3 pb-4">
                  <CardTitle className="font-display text-xl">Trial</CardTitle>
                  <CardDescription className="text-[14px] leading-relaxed">
                    Teste completo por {LANDING_TRIAL_DAYS} dias — sem cartão de crédito.
                  </CardDescription>
                  <p className="pt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
                    Grátis
                  </p>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {[
                      "Espaço white-label com sua marca",
                      "Convites, programas e check-ins",
                      "Radar básico de retenção",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="h-11 w-full rounded-full" variant="outline">
                    <Link to="/register">Começar grátis</Link>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal delay={120}>
              <Card
                className={cn(
                  "landing-card relative h-full overflow-hidden border-primary/45 bg-gradient-to-b from-primary/12 to-card shadow-[0_20px_56px_hsl(var(--primary)/0.14)] md:scale-[1.02]",
                )}
              >
                <span className="absolute right-4 top-4 rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                  Recomendado
                </span>
                <CardHeader className="gap-3 pb-4 pt-8">
                  <CardTitle className="font-display text-xl">Pro</CardTitle>
                  <CardDescription className="text-[14px] leading-relaxed">
                    Copiloto, digest, ranking e retenção avançada para escalar sua base.
                  </CardDescription>
                  <p className="pt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
                    {LANDING_PRO_PRICE}
                  </p>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {[
                      "Copiloto com function calling",
                      "Central de retenção e ranking",
                      "Digest por e-mail e alertas",
                      "Menor taxa de plataforma nas vendas",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="h-11 w-full rounded-full shadow-[0_10px_32px_hsl(var(--primary)/0.25)]">
                    <Link to="/register">Começar trial Pro</Link>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <LandingFaq />

      <section className="landing-cta-band border-t border-border/60 py-16 md:py-20">
        <Reveal className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Radar className="size-6 text-primary" aria-hidden />
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.035em] md:text-4xl">
            Comece grátis hoje
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
            Monte seu espaço, convide os primeiros alunos e veja quem precisa de atenção — o Radar
            trabalha com você desde o primeiro check-in.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-8 shadow-[0_12px_40px_hsl(var(--primary)/0.28)]">
              <Link to="/register">Começar grátis</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="h-12 rounded-full px-8">
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
