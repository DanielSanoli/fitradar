import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe neste app.</p>
      <Button asChild>
        <Link to="/">Ir para início</Link>
      </Button>
    </div>
  );
}
