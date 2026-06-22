import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Radar,
  Settings,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const creatorLinks = [
  { to: "/app", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/app/students", label: "Alunos", icon: Users },
  { to: "/app/programs", label: "Programas", icon: ClipboardList },
  { to: "/app/space", label: "Espaço", icon: Sparkles },
  { to: "/app/retention", label: "Retenção", icon: Radar },
  { to: "/app/ranking", label: "Ranking", icon: Trophy },
  { to: "/app/settings", label: "Configurações", icon: Settings },
];

type SidebarProps = {
  variant: "creator" | "student";
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ variant, className, onNavigate }: SidebarProps) {
  const { logout } = useAuth();
  const links = creatorLinks;

  if (variant === "student") {
    return null;
  }

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex h-14 items-center px-4">
        <BrandLogo />
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Principal">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start border-sidebar-border bg-transparent"
          onClick={() => logout()}
        >
          <LogOut className="size-4" aria-hidden />
          Sair
        </Button>
      </div>
    </aside>
  );
}
