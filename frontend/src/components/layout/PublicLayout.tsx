import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SkipLink } from "@/components/layout/SkipLink";
import { Button } from "@/components/ui/button";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
] as const;

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <header
        className={cn(
          "sticky top-0 z-30 border-b transition-[background-color,box-shadow,border-color] duration-200",
          scrolled
            ? "border-border/80 bg-background/90 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            : "border-transparent bg-background/70 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:h-16 md:px-6">
          <BrandLogo />
          <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label="Marketing">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              Entrar
            </Link>
            <Button asChild size="sm" className="rounded-full px-4">
              <Link to="/register">Começar grátis</Link>
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/register">Começar</Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}
