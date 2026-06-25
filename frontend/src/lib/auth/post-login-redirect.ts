import type { UserRole } from "@/lib/api/types";

const BLOCKED_REDIRECTS = new Set(["/login", "/register", "/forgot-password", "/"]);

function homeForRole(role: UserRole): string {
  if (role === "STUDENT") return "/student";
  return "/app";
}

function isRoleAllowedPath(role: UserRole, path: string): boolean {
  if (role === "STUDENT") {
    return path.startsWith("/student");
  }
  if (role === "CREATOR" || role === "ADMIN") {
    return path.startsWith("/app");
  }
  return false;
}

/** Caminho interno seguro após login, respeitando `state.from` quando compatível com o papel. */
export function resolvePostLoginRedirect(
  from: string | undefined,
  role: UserRole,
): string {
  if (
    from &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    !BLOCKED_REDIRECTS.has(from) &&
    isRoleAllowedPath(role, from)
  ) {
    return from;
  }
  return homeForRole(role);
}
