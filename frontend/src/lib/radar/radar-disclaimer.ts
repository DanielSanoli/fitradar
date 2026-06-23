/** Strips the standard Radar disclaimer when shown once in the widget footer. */
export const RADAR_DISCLAIMER = "Sugestão, não orientação médica/profissional.";

export function stripRadarDisclaimer(text: string): string {
  return text.replace(/\s*Sugestão, não orientação médica\/profissional\.?\s*$/i, "").trimEnd();
}
