import { Menu } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { RetentionAlertsInbox } from "@/components/creator/RetentionAlertsInbox";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type TopbarProps = {
  title?: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
};

export function Topbar({ title, onMenuClick, showMenu = false }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md">
      {showMenu ? (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
      ) : (
        <div className="md:hidden">
          <BrandLogo />
        </div>
      )}
      {title ? (
        <p className="truncate font-display text-base font-semibold tracking-tight md:text-lg">{title}</p>
      ) : (
        <span className="hidden md:inline-flex">
          <BrandLogo />
        </span>
      )}
      <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
        <RetentionAlertsInbox />
        {user ? <span className="max-w-[12rem] truncate">{user.name}</span> : null}
      </div>
    </header>
  );
}
