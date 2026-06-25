import { LEGAL_LINKS } from "@/lib/legal/constants";
import { cn } from "@/lib/utils";

type TermsAcceptanceFieldProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function TermsAcceptanceField({
  checked,
  onCheckedChange,
  disabled,
  id = "accept-terms",
  className,
}: TermsAcceptanceFieldProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[11px] border border-border bg-secondary/20 px-3.5 py-3 text-sm leading-relaxed",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-primary"
        required
      />
      <span>
        Li e aceito os{" "}
        <a
          href={LEGAL_LINKS.terms}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Termos de Uso
        </a>{" "}
        e a{" "}
        <a
          href={LEGAL_LINKS.privacy}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Política de Privacidade
        </a>
        .
      </span>
    </label>
  );
}
