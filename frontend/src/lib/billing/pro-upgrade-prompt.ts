let showPrompt: ((message: string) => void) | null = null;

export function registerProUpgradePrompt(handler: ((message: string) => void) | null) {
  showPrompt = handler;
}

export function promptProUpgrade(message: string) {
  showPrompt?.(message);
}

export const FREE_LIMIT_MESSAGE_SNIPPET = "Limite do plano Free atingido";

export function isFreeLimitError(message: string): boolean {
  return message.includes(FREE_LIMIT_MESSAGE_SNIPPET);
}

export function isProFeatureError(message: string): boolean {
  return message.includes("Recurso disponível no plano Pro");
}
