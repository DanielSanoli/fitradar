import { NavLink, Outlet } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SkipLink } from "@/components/layout/SkipLink";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { STUDENT_NAV_ITEMS } from "@/lib/student/student-nav";
import { cn } from "@/lib/utils";

export function StudentLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SkipLink />
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center px-4">
          <BrandLogo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Menu lateral do aluno">
          {STUDENT_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
              <Icon className="size-4 shrink-0" aria-hidden />
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

        <main
          id="main-content"
          className="flex-1 p-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:p-6 md:pb-6"
        >
          <Outlet />
        </main>

        <StudentBottomNav />
      </div>
    </div>
  );
}
