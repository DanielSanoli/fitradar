import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Check,
  Radar,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { HeroDashboardMockup } from "@/components/marketing/HeroDashboardMockup";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const HERO_STATS = [
  { value: "14 dias", label: "Trial Pro completo" },
  { value: "0%", label: "Comissão no plano Pro" },
  { value: "PWA", label: "Aluno treina sem app store" },
] as const;

const TOUR_STEPS = [
  {
    icon: Users,
    title: "Monte sua comunidade",
    description:
      "Convide alunos, publique programas e personalize o espaço com sua marca e nicho fitness.",
  },
  {
    icon: Radar,
    title: "Radar de retenção",
    description:
      "Métricas calculadas pelo motor determinístico — aderência, risco de churn e quem precisa de atenção hoje.",
  },
  {
    icon: Smartphone,
    title: "Aluno treina no celular",
    description:
      "PWA instalável em /student: check-in, streak e progresso sem depender de app store.",
  },
] as const;

const PROOF_POINTS = [
  { icon: Shield, title: "Números confiáveis", text: "A IA interpreta sinais do motor — nunca inventa métricas." },
  { icon: Bell, title: "Ação no dia", text: "Alertas e lembretes sugeridos quando alguém precisa de atenção." },
  { icon: Zap, title: "Copiloto integrado", text: "Pergunte ao Radar o que fazer com base nos seus dados reais." },
] as const;

const PLANS = [
  {
    name: "Trial",
    price: "Grátis para começar",
    description: "Ideal para validar o espaço e convidar os primeiros alunos.",
    features: ["Espaço white-label", "Programas e convites", "Radar básico de retenção"],
    cta: { label: "Criar conta", to: "/register" },
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Assinatura mensal",
    description: "Para criadores que querem copiloto, digest e retenção avançada.",
    features: [
      "Copiloto com function calling",
      "Central de retenção e ranking",
      "Digest por e-mail e alertas",
    ],
    cta: { label: "Começar trial Pro", to: "/register" },
    highlighted: true,
  },
] as const;

export function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <section className="landing-hero relative border-b border-border/60">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-12 md:px-6 md:py-20 lg:py-24">
          <div className="space-y-6 text-center md:text-left">
            <p
              className="motion-safe:animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"
              style={{ animationDelay: "40ms" }}
            >
              <Sparkles className="size-3.5" aria-hidden />
              Copiloto de retenção para criadores fitness
            </p>

            <div className="space-y-4">
              <h1
                className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-foreground motion-safe:animate-fade-in-up md:text-5xl lg:text-[3.35rem]"
                style={{ animationDelay: "90ms" }}
              >
                Área de membros com{" "}
                <span className="bg-gradient-to-r from-primary via-[hsl(165_80%_62%)] to-[hsl(190_70%_58%)] bg-clip-text text-transparent">
                  copiloto de retenção
                </span>
              </h1>
              <p
                className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground motion-safe:animate-fade-in-up md:mx-0 md:text-[17px] md:leading-7"
                style={{ animationDelay: "140ms" }}
              >
                Previna churn antes que aconteça. Métricas determinísticas, alertas acionáveis e
                experiência mobile para o aluno treinar — a IA interpreta os sinais, nunca inventa
                números.
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-3 motion-safe:animate-fade-in-up sm:flex-row md:justify-start"
              style={{ animationDelay: "190ms" }}
            >
              <Button asChild size="lg" className="h-12 min-w-[200px] rounded-full px-6 text-[15px]">
                <Link to="/register">
                  Começar como criador
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-[15px]">
                <Link to="/login">Entrar</Link>
              </Button>
            </div>

            <dl
              className="grid grid-cols-1 gap-3 motion-safe:animate-fade-in-up sm:grid-cols-3 md:max-w-xl"
              style={{ animationDelay: "240ms" }}
            >
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[12px] border border-border/70 bg-card/50 px-3.5 py-3 text-center md:text-left"
                >
                  <dt className="font-display text-xl font-extrabold tracking-tight text-primary">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-[12px] leading-snug text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroDashboardMockup className="md:justify-self-end" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20" aria-labelledby="proof-heading">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="proof-heading" className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            Feito para quem vive de retenção, não de planilha
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            O FitRadar combina área de membros, motor de retenção e copiloto — tudo no mesmo fluxo do
            criador.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PROOF_POINTS.map((point, index) => (
            <Reveal key={point.title} delay={index * 70}>
              <Card className="landing-card h-full border-border/80 bg-card/80">
                <CardHeader className="gap-4 pb-2">
                  <div className="flex size-11 items-center justify-center rounded-[12px] border border-primary/25 bg-primary/10">
                    <point.icon className="size-5 text-primary" aria-hidden />
                  </div>
                  <CardTitle className="font-display text-lg">{point.title}</CardTitle>
                  <CardDescription className="text-[14px] leading-relaxed">{point.text}</CardDescription>
                </CardHeader>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-y border-border/60 bg-secondary/20 py-16 md:py-20"
        aria-labelledby="tour-heading"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal className="text-center">
            <h2 id="tour-heading" className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              Como funciona
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-[15px]">
              Do convite ao check-in — em três passos.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TOUR_STEPS.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} delay={index * 80}>
                <Card className="landing-card h-full text-left">
                  <CardHeader className="gap-4">
                    <div className="flex size-11 items-center justify-center rounded-[12px] border border-primary/30 bg-primary/10">
                      <Icon className="size-5 text-primary" aria-hidden />
                    </div>
                    <CardTitle className="font-display text-lg">{title}</CardTitle>
                    <CardDescription className="text-[14px] leading-relaxed">{description}</CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="planos"
        className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20"
        aria-labelledby="pricing-heading"
      >
        <Reveal className="text-center">
          <h2 id="pricing-heading" className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            Planos para criadores
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-[15px]">
            Cobrança digital no web (Asaas) — sem comissão de loja de apps.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 90}>
              <Card
                className={cn(
                  "landing-card h-full",
                  plan.highlighted &&
                    "border-primary/45 bg-gradient-to-b from-primary/10 to-card shadow-[0_16px_48px_hsl(var(--primary)/0.12)] md:scale-[1.02]",
                )}
              >
                <CardHeader className="gap-3 pb-4">
                  <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-[14px] leading-relaxed">{plan.description}</CardDescription>
                  <p className="pt-1 font-display text-2xl font-extrabold tracking-tight text-foreground">
                    {plan.price}
                  </p>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="h-11 w-full rounded-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link to={plan.cta.to}>{plan.cta.label}</Link>
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="mx-auto max-w-6xl px-4 pb-10 md:px-6">
          <Card className="landing-card border-border/80 bg-card/90">
            <CardHeader className="gap-3">
              <CardTitle className="font-display text-xl">Para alunos</CardTitle>
              <CardDescription className="text-[14px] leading-relaxed">
                Acesse treinos, faça check-in e acompanhe streak pelo celular — instale a PWA em{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/student</code> após o login.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm leading-relaxed text-muted-foreground">
              Perfil, notificações push e sessões ativas ficam em{" "}
              <Link to="/student/settings" className="font-medium text-primary hover:underline">
                /student/settings
              </Link>{" "}
              (requer login de aluno).
            </CardContent>
          </Card>
        </section>
      </Reveal>

      <section className="landing-cta-band border-t border-border/60 py-14 md:py-16">
        <Reveal className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            Pronto para ver quem precisa de atenção hoje?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Crie seu espaço, convide os primeiros alunos e deixe o Radar trabalhar com você desde o
            primeiro check-in.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-7">
              <Link to="/register">Criar conta grátis</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="h-12 rounded-full px-7">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
