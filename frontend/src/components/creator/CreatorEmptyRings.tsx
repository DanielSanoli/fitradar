type CreatorEmptyRingsProps = {
  size?: "md" | "lg";
};

export function CreatorEmptyRings({ size = "md" }: CreatorEmptyRingsProps) {
  const outer = size === "lg" ? "size-[82px]" : "size-20";
  const mid = size === "lg" ? "size-14" : "size-[54px]";
  const inner = size === "lg" ? "size-[30px]" : "size-7";

  return (
    <div className={`relative flex ${outer} items-center justify-center`}>
      <span
        className={`absolute ${outer} rounded-full border border-primary/25`}
        aria-hidden
      />
      <span
        className={`absolute ${mid} rounded-full border border-primary/40`}
        aria-hidden
      />
      <span
        className={`absolute ${inner} rounded-full border border-primary/55`}
        aria-hidden
      />
      <span
        className="size-2.5 rounded-full bg-primary shadow-[0_0_14px_hsl(var(--primary))]"
        aria-hidden
      />
    </div>
  );
}
