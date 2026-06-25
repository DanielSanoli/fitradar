import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthenticatedRadarShell } from "@/components/radar/AuthenticatedRadarShell";
import { Outlet } from "react-router-dom";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { PageTitleProvider } from "@/hooks/usePageTitle";
import { SpaceVocabularyProvider } from "@/hooks/useSpaceVocabulary";

export function RootLayout() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <PageTitleProvider>
          <AuthProvider>
            <SpaceVocabularyProvider>
              <AuthenticatedRadarShell>
                <Outlet />
                <InstallBanner />
              </AuthenticatedRadarShell>
            </SpaceVocabularyProvider>
          </AuthProvider>
        </PageTitleProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}
