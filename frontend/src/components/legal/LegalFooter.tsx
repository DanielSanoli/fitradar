import { LEGAL_LINKS } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

type LegalFooterProps = {
  className?: string;
};

export function LegalFooter({ className }: LegalFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border bg-background/85 px-4 py-6 text-center text-xs text-muted-foreground",
        className,
      )}
    >
      <nav aria-label="Documentos legais">
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <li>
            <a
              href={LEGAL_LINKS.terms}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Termos de Uso
            </a>
          </li>
          <li>
            <a
              href={LEGAL_LINKS.privacy}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Política de Privacidade
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
