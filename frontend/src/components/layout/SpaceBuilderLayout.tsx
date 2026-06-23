import { Outlet } from "react-router-dom";
import { SkipLink } from "@/components/layout/SkipLink";

/** Full-bleed layout for the space builder wizard (no sidebar — matches prototype). */
export function SpaceBuilderLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(1100px_560px_at_82%_-14%,hsl(165_40%_12%),hsl(215_28%_7%)_56%)] text-foreground">
      <SkipLink />
      <Outlet />
    </div>
  );
}
