import { Link } from "react-router-dom";
import { Radar, Smartphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LegalFooter } from "@/components/legal/LegalFooter";

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
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12 md:py-16">
      <section className="space-y-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">FitRadar</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Área de membros com copiloto de retenção
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground">
          Previna churn antes que aconteça. Métricas determinísticas, alertas acionáveis e experiência
          mobile para o aluno treinar — a IA interpreta os sinais, nunca inventa números.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/register">Começar como criador</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="tour-heading" className="space-y-5">
        <div className="text-center">
          <h2 id="tour-heading" className="text-xl font-bold tracking-tight">
            Como funciona
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Do convite ao check-in — em três passos.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TOUR_STEPS.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="text-left">
              <CardHeader className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-[10px] border border-primary/30 bg-primary/10">
                  <Icon className="size-5 text-primary" aria-hidden />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="pricing-heading" className="space-y-5">
        <div className="text-center">
          <h2 id="pricing-heading" className="text-xl font-bold tracking-tight">
            Planos para criadores
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cobrança digital no web (Asaas) — sem comissão de loja de apps.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlighted
                  ? "border-primary/40 bg-gradient-to-b from-primary/5 to-card"
                  : undefined
              }
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="pt-1 text-lg font-bold text-foreground">{plan.price}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-primary" aria-hidden>
                        •
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                  <Link to={plan.cta.to}>{plan.cta.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="text-left">
        <CardHeader>
          <CardTitle>Para alunos</CardTitle>
          <CardDescription>
            Acesse treinos, faça check-in e acompanhe streak pelo celular — instale a PWA em{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/student</code> após o login.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Perfil, notificações push e sessões ativas ficam em{" "}
          <Link to="/student/settings" className="font-medium text-primary hover:underline">
            /student/settings
          </Link>{" "}
          (requer login de aluno).
        </CardContent>
      </Card>

      <LegalFooter className="border-t border-border pt-6" />
    </div>
  );
}
