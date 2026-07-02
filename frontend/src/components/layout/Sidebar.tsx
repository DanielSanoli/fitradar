import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CreatorSpaceSidebarBrand } from "@/components/fitness/CreatorSpaceSidebarBrand";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useSpaceVocabulary } from "@/hooks/useSpaceVocabulary";
import type { SpaceVocabulary } from "@/lib/space/vocabulary";
import { cn } from "@/lib/utils";

type StaticCreatorLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type VocabCreatorLink = {
  to: string;
  labelKey: "programsNav";
  iconKey: "programIcon";
};

const creatorLinkDefs: Array<StaticCreatorLink | VocabCreatorLink> = [
  { to: "/app", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/app/retention", label: "Retenção", icon: Activity },
  { to: "/app/students", label: "Alunos", icon: Users },
  { to: "/app/programs", labelKey: "programsNav" as const, iconKey: "programIcon" as const },
  { to: "/app/marketplace", label: "Vendas", icon: ShoppingBag },
  { to: "/app/space", label: "Meu espaço", icon: Sparkles },
  { to: "/app/ranking", label: "Ranking", icon: Trophy },
  { to: "/app/settings", label: "Configurações", icon: Settings },
];

function resolveCreatorLinkIcon(
  link: StaticCreatorLink | VocabCreatorLink,
  vocabulary: SpaceVocabulary,
): LucideIcon {
  return "iconKey" in link ? vocabulary[link.iconKey] : link.icon;
}

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function planLabel(plan: string | undefined): string {
  if (!plan) return "Plano";
  return plan === "PRO" ? "Plano Pro" : `Plano ${plan}`;
}

type SidebarProps = {
  variant: "creator" | "student";
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ variant, className, onNavigate }: SidebarProps) {
  const { logout, user } = useAuth();
  const { vocabulary } = useSpaceVocabulary();
  const creatorLinks = creatorLinkDefs.map((link) => ({
    to: link.to,
    icon: resolveCreatorLinkIcon(link, vocabulary),
    end: "end" in link ? link.end : undefined,
    label: "labelKey" in link ? vocabulary.programsNav : link.label,
  }));

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
      <div className="flex h-16 items-center px-5">
        <BrandLogo />
      </div>
      <CreatorSpaceSidebarBrand />
      <Separator className="bg-sidebar-border" />
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Principal">
        {creatorLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-[colors,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:hover:translate-x-0.5",
                isActive
                  ? "bg-sidebar-accent pl-4 font-semibold text-sidebar-accent-foreground before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-primary before:shadow-[0_0_10px_hsl(var(--primary))]"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )
            }
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 p-3">
        {user ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5">
            <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] border border-primary/30 bg-primary/15 text-[13px] font-extrabold text-primary">
              {userInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-[11.5px] text-muted-foreground">{planLabel(user.plan)}</p>
            </div>
          </div>
        ) : null}
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
