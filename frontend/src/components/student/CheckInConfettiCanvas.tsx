import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  life: number;
};

const COLORS = [
  "hsl(165 76% 48%)",
  "hsl(24 95% 58%)",
  "hsl(38 96% 56%)",
  "hsl(210 80% 62%)",
  "hsl(280 65% 62%)",
];

type CheckInConfettiCanvasProps = {
  active: boolean;
};

/** Confete leve em canvas — desligado via CSS quando prefers-reduced-motion. */
export function CheckInConfettiCanvas({ active }: CheckInConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: 48 }, () => ({
      x: window.innerWidth * (0.35 + Math.random() * 0.3),
      y: window.innerHeight * 0.38,
      vx: (Math.random() - 0.5) * 6,
      vy: -2 - Math.random() * 5,
      size: 4 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.2,
      life: 1,
    }));

    const startedAt = performance.now();
    const durationMs = 2200;

    const tick = (now: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const elapsed = now - startedAt;
      const fade = elapsed > durationMs * 0.65 ? 1 - (elapsed - durationMs * 0.65) / (durationMs * 0.35) : 1;

      for (const p of particles) {
        p.vy += 0.12;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        p.life = fade;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (elapsed < durationMs) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="check-in-confetti pointer-events-none fixed inset-0 z-[59]"
      aria-hidden
    />
  );
}
