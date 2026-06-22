import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[FitRadar] UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Não foi possível carregar esta tela. Tente recarregar ou volte ao início.</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => window.location.reload()}>Recarregar</Button>
                <Button variant="outline" asChild>
                  <Link to="/">Ir ao início</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
