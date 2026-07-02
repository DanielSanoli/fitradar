import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function NutritionDisclaimer() {
  return (
    <Alert className="border-border/80 bg-secondary/20">
      <AlertCircle className="size-4 text-primary" aria-hidden />
      <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
        Valores nutricionais de referência (TACO). O plano é de responsabilidade do profissional.
        Prescrição de dieta é privativa de nutricionista (CFN).
      </AlertDescription>
    </Alert>
  );
}
