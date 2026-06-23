import { NavLink, Outlet } from "react-router-dom";
import { CalendarCheck, Target } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SkipLink } from "@/components/layout/SkipLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/student", label: "Início", icon: CalendarCheck, end: true },
  { to: "/student/progress", label: "Progresso", icon: Target },
];

export function StudentLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SkipLink />
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center px-4">
          <BrandLogo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60",
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <Button variant="outline" className="w-full" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:hidden">
          <BrandLogo />
          <span className="max-w-[10rem] truncate text-sm text-muted-foreground">{user?.name}</span>
        </header>

        <main id="main-content" className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>

        <nav
          className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
          aria-label="Navegação do aluno"
        >
          <div className="mx-auto flex max-w-lg">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
