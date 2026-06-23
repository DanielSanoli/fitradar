import { useLocation } from "react-router-dom";
import { RadarFloatingWidget } from "@/components/radar/RadarFloatingWidget";
import { RadarCopilotProvider } from "@/features/radar/RadarCopilotProvider";
import { useAuth } from "@/hooks/useAuth";

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/404"]);

export function AuthenticatedRadarShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();

  const showWidget =
    isAuthenticated && !isLoading && !PUBLIC_PATHS.has(pathname);

  return (
    <RadarCopilotProvider>
      {children}
      <RadarFloatingWidget visible={showWidget} />
    </RadarCopilotProvider>
  );
}
