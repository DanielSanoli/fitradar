import { Outlet } from "react-router-dom";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function PublicLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <BrandLogo />
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
