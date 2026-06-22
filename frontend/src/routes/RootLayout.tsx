import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Outlet } from "react-router-dom";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/AuthProvider";

export function RootLayout() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Outlet />
          <InstallBanner />
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}
