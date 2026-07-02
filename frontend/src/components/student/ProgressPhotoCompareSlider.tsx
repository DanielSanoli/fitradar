import { useState } from "react";
import { cn } from "@/lib/utils";

export type ProgressPhotoCompareSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
};

export function ProgressPhotoCompareSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Antes",
  afterLabel = "Depois",
  className,
}: ProgressPhotoCompareSliderProps) {
  const [position, setPosition] = useState(50);

  return (
    <div className={cn("relative aspect-[3/4] overflow-hidden rounded-2xl border border-border", className)}>
      <img src={afterSrc} alt={afterLabel} className="absolute inset-0 size-full object-cover" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img src={beforeSrc} alt={beforeLabel} className="size-full object-cover" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.45)]"
        style={{ left: `${position}%` }}
      />
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        aria-label="Comparar fotos antes e depois"
        className="absolute inset-x-4 bottom-4 z-10 accent-primary"
        onChange={(e) => setPosition(Number(e.target.value))}
      />
      <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
        {afterLabel}
      </span>
    </div>
  );
}
