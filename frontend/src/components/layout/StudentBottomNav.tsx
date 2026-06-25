import { NavLink } from "react-router-dom";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import { getStudentNavItems } from "@/lib/student/student-nav";
import { cn } from "@/lib/utils";

/** Mobile bottom navigation — always renders every item; active route is highlighted only. */
export function StudentBottomNav() {
  const { vocabulary } = useSpaceVocabulary();
  const navItems = getStudentNavItems(vocabulary);

  return (
    <nav
      data-testid="student-bottom-nav"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_24px_rgba(0,0,0,0.35)] max-md:block md:hidden"
      aria-label="Navegação inferior do aluno"
    >
      <ul className="mx-auto flex w-full max-w-lg list-none divide-x divide-border p-0">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary/50 text-foreground/80 hover:bg-secondary hover:text-foreground",
                )
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
