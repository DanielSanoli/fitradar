import { useSearchParams } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { VerifyEmailPage } from "@/features/auth/VerifyEmailPage";

/** /login — login, reset (?reset=) or verify (?verify=) from e-mail links (AuthService). */
export function LoginRoute() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("reset");
  const verifyToken = searchParams.get("verify");

  if (resetToken?.trim()) {
    return <ResetPasswordPage token={resetToken.trim()} />;
  }

  if (verifyToken?.trim()) {
    return <VerifyEmailPage token={verifyToken.trim()} />;
  }

  return <LoginPage />;
}
