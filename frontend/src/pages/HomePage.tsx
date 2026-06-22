import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">FitRadar</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Área de membros com copiloto de retenção
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Previna churn antes que aconteça. Métricas determinísticas, alertas acionáveis e uma
          experiência pensada para mobile — para criadores e alunos.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/login">Entrar</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/register">Começar como criador</Link>
        </Button>
      </div>
      <Card className="text-left">
        <CardHeader>
          <CardTitle>Para criadores fitness</CardTitle>
          <CardDescription>
            Convide alunos, publique programas, acompanhe aderência e receba alertas quando alguém
            precisar de atenção.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Alunos acessam treinos e check-in pelo celular. Métricas vêm do motor de retenção — a IA
          apenas interpreta os sinais já calculados.
        </CardContent>
      </Card>
    </div>
  );
}
