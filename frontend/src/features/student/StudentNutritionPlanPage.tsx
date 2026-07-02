import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StudentNutritionPlanPanel } from "@/features/student/StudentNutritionPlanPanel";
import { usePageTitle } from "@/hooks/usePageTitle";

export function StudentNutritionPlanPage() {
  const { programId = "" } = useParams();
  usePageTitle("Plano alimentar");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-28 px-1 pt-1 md:pb-8">
      <Button variant="outline" size="sm" asChild className="h-9 w-fit gap-2 rounded-[9px]">
        <Link to="/student/programs">
          <ChevronLeft className="size-4" aria-hidden />
          Voltar aos planos
        </Link>
      </Button>
      <StudentNutritionPlanPanel programId={programId} programTitle="Plano alimentar" />
    </div>
  );
}
