import { cn } from "@/lib/utils";

type FieldErrorProps = {
  id?: string;
  message?: string;
  className?: string;
};

/** Inline validation message below form fields. */
export function FieldError({ id, message, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn("mt-1.5 text-xs font-medium text-destructive", className)}
    >
      {message}
    </p>
  );
}
