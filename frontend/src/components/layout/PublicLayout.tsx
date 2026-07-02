import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SkipLink } from "@/components/layout/SkipLink";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#solucao", label: "Solução" },
  { href: "#recursos", label: "Recursos" },
  { href: "#planos", label: "Preços" },
  { href: "#duvidas", label: "Dúvidas" },
] as const;

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

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
          {isLanding ? (
            <>
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
            </>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/register">Começar grátis</Link>
              </Button>
            </div>
          )}
        </div>
        {isLanding ? (
          <nav
            className="flex gap-2 overflow-x-auto border-t border-border/40 px-4 py-2.5 md:hidden"
            aria-label="Seções da página"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      {isLanding ? <MarketingFooter /> : <LegalFooter />}
    </div>
  );
}
