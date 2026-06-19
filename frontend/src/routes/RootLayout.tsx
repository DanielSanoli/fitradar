import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
