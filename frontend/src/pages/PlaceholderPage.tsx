import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Olá, <strong className="text-foreground">{user?.name}</strong>. Esta seção será liberada em
          uma próxima atualização.
        </p>
        {!user?.accessAllowed && user?.role === "CREATOR" ? (
          <p className="text-[hsl(38_100%_56%)]">
            {user.accessMessage ?? "Sua assinatura precisa de atenção."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
