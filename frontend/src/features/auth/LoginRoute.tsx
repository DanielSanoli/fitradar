import { useSearchParams } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";

/** /login — login form, or reset form when ?reset=token (matches e-mail link from AuthService). */
export function LoginRoute() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("reset");

  if (resetToken?.trim()) {
    return <ResetPasswordPage token={resetToken.trim()} />;
  }

  return <LoginPage />;
}
