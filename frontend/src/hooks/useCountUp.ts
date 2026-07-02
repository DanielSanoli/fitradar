import { useEffect, useState } from "react";

function parseNumericValue(value: string | number): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatAnimatedValue(current: number, target: number): string | number {
  return Number.isInteger(target) ? Math.round(current) : Math.round(current * 10) / 10;
}

export function useCountUp(value: string | number, duration = 600): string | number {
  const numericTarget = parseNumericValue(value);
  const [display, setDisplay] = useState<string | number>(value);

  useEffect(() => {
    if (numericTarget === null || prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(formatAnimatedValue(numericTarget * eased, numericTarget));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    setDisplay(formatAnimatedValue(0, numericTarget));
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, numericTarget, duration]);

  return display;
}
