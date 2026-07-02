import { NavLink, Outlet, useLocation } from "react-router-dom";
import { SkipLink } from "@/components/layout/SkipLink";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { PoweredByFitRadar } from "@/components/student/PoweredByFitRadar";
import { SpaceCategoryMark } from "@/components/fitness/SpaceCategoryMark";
import { Button } from "@/components/ui/button";
import { useResolvedPageTitle } from "@/hooks/usePageTitle";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import { useStudentSpace, StudentSpaceProvider } from "@/hooks/useStudentSpace";
import { useAuth } from "@/hooks/useAuth";
import { normalizeSpaceCategory } from "@/lib/creator/space-categories";
import { getStudentNavItems } from "@/lib/student/student-nav";
import { cn } from "@/lib/utils";

function StudentMobileBrand() {
  const { space, accent, isLoading } = useStudentSpace();
  const title = useResolvedPageTitle();

  if (isLoading) {
    return <span className="max-w-[10rem] truncate text-sm font-semibold text-foreground">{title}</span>;
  }

  if (!space) {
    return <span className="max-w-[10rem] truncate text-sm font-semibold text-foreground">{title}</span>;
  }

  return (
    <div className="flex min-w-0 max-w-[12rem] items-center gap-2">
      {space.logoUrl ? (
        <img
          src={space.logoUrl}
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 rounded-lg border border-border object-cover"
        />
      ) : (
        <SpaceCategoryMark
          category={space.category}
          primaryColor={accent}
          size="sm"
          className="!size-7"
        />
      )}
      <span className="truncate text-sm font-bold text-foreground">{space.name}</span>
    </div>
  );
}

function StudentSidebarBrand() {
  const { space, accent, isLoading } = useStudentSpace();

  if (isLoading) {
    return (
      <div className="px-4 pb-3">
        <div className="h-10 rounded-lg skeleton-shimmer motion-safe:animate-shimmer" aria-hidden />
      </div>
    );
  }

  if (!space) return null;

  return (
    <div className="px-4 pb-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {space.logoUrl ? (
          <img
            src={space.logoUrl}
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-lg border border-sidebar-border object-cover"
          />
        ) : (
          <SpaceCategoryMark
            category={normalizeSpaceCategory(space.category)}
            primaryColor={accent}
            size="md"
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{space.name}</p>
          {space.bio ? (
            <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">{space.bio}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StudentLayoutShell() {
  const { logout } = useAuth();
  const { vocabulary } = useSpaceVocabulary();
  const navItems = getStudentNavItems(vocabulary);
  const location = useLocation();

  return (
    <>
      <SkipLink />
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <StudentSidebarBrand />
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Menu lateral do aluno">
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
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 p-3">
          <Button variant="outline" className="w-full" onClick={() => logout()}>
            Sair
          </Button>
          <PoweredByFitRadar className="text-center" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:hidden">
          <StudentMobileBrand />
        </header>

        <main
          id="main-content"
          className="flex-1 p-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:p-6 md:pb-6"
        >
          <div key={location.pathname} className="app-page-enter motion-safe:animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:hidden">
          <PoweredByFitRadar className="pb-2 text-center" />
        </div>

        <StudentBottomNav />
      </div>
    </>
  );
}

export function StudentLayout() {
  return (
    <StudentSpaceProvider>
      <StudentLayoutShell />
    </StudentSpaceProvider>
  );
}
