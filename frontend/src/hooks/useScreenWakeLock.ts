import { useEffect, useRef } from "react";

type WakeLockSentinel = {
  release: () => Promise<void>;
};

/**
 * Mantém a tela acesa durante a sessão de treino (Screen Wake Lock API).
 * Falha silenciosamente quando não suportado ou negado pelo navegador.
 */
export function useScreenWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;

    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };

    let cancelled = false;

    async function acquire() {
      if (!nav.wakeLock) return;
      try {
        const sentinel = await nav.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // permissão negada ou API indisponível — fallback silencioso
      }
    }

    void acquire();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && active) {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinelRef.current?.release();
      sentinelRef.current = null;
    };
  }, [active]);
}
