import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  variant: "creator" | "student";
};

const titles: Record<string, string> = {
  "/app": "Painel do criador",
  "/app/retention": "Retenção",
  "/app/students": "Alunos",
  "/app/ranking": "Ranking",
  "/app/settings": "Configurações",
  "/student": "Área do aluno",
  "/student/progress": "Progresso",
  "/student/workouts": "Treinos",
};

export function AppLayout({ variant }: AppLayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = titles[location.pathname] ?? "FitRadar";

  return (
    <div className="flex min-h-screen">
      <Sidebar variant={variant} className="hidden md:flex" />
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar
            variant={variant}
            className="relative z-10 h-full shadow-xl"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} showMenu onMenuClick={() => setMobileOpen(true)} />
        <main id="main-content" className={cn("flex-1 p-4 md:p-6")}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
