import { BrandLogo } from "@/components/layout/BrandLogo";
import { LEGAL_LINKS } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

type MarketingFooterProps = {
  className?: string;
};

const SOCIAL_PLACEHOLDERS = [
  { label: "Instagram (em breve)", href: "#" },
  { label: "LinkedIn (em breve)", href: "#" },
] as const;

export function MarketingFooter({ className }: MarketingFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border/80 bg-background/90", className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="space-y-3">
          <BrandLogo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Copiloto de retenção para coaches, personais e nutricionistas — área de membros com
            Radar integrado.
          </p>
        </div>

        <nav aria-label="Rodapé" className="flex flex-wrap gap-10 text-sm">
          <div className="space-y-2.5">
            <p className="insight-label">Produto</p>
            <ul className="space-y-2">
              <li>
                <a href="#solucao" className="text-muted-foreground hover:text-primary hover:underline">
                  Solução
                </a>
              </li>
              <li>
                <a href="#recursos" className="text-muted-foreground hover:text-primary hover:underline">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#planos" className="text-muted-foreground hover:text-primary hover:underline">
                  Preços
                </a>
              </li>
              <li>
                <a href="#duvidas" className="text-muted-foreground hover:text-primary hover:underline">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2.5">
            <p className="insight-label">Legal</p>
            <ul className="space-y-2">
              <li>
                <a href={LEGAL_LINKS.terms} className="text-muted-foreground hover:text-primary hover:underline">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href={LEGAL_LINKS.privacy} className="text-muted-foreground hover:text-primary hover:underline">
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2.5">
            <p className="insight-label">Redes</p>
            <ul className="space-y-2">
              {SOCIAL_PLACEHOLDERS.map((social) => (
                <li key={social.label}>
                  <span className="text-muted-foreground/80" aria-disabled="true">
                    {social.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {year} FitRadar. Todos os direitos reservados.
      </div>
    </footer>
  );
}
