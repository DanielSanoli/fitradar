import { Outlet } from "react-router-dom";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SkipLink } from "@/components/layout/SkipLink";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <BrandLogo />
        </div>
      </header>
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <LegalFooter />
    </div>
  );
}
