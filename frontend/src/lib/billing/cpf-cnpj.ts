/** Keeps only digits from a CPF/CNPJ input. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

/** Masks CPF (11) or CNPJ (14) while typing. */
export function maskCpfCnpj(value: string): string {
  const digits = digitsOnly(value);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
