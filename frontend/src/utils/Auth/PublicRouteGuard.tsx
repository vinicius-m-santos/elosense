import { useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getRoleHome } from "@/stores/authStore";
import { getPersistedAuth } from "./getPersistedAuth";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/register-success",
  "/verify-email",
  "/email-not-verified",
  "/forgot-password",
  "/reset-password",
  "/client-register",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/verify-email/")) return true;
  if (pathname.startsWith("/reset-password/")) return true;
  if (pathname.startsWith("/client-register/")) return true;
  return false;
}

type PublicRouteGuardProps = {
  children: React.ReactNode;
};

export default function PublicRouteGuard({ children }: PublicRouteGuardProps) {
  const location = useLocation();

  const redirectTo = useMemo(() => {
    if (!isPublicPath(location.pathname)) return null;
    const auth = getPersistedAuth();
    if (!auth) return null;
    const hasToken = !!(auth.accessToken || auth.refreshToken);
    const hasUserWithRoles =
      auth.user?.roles && Array.isArray(auth.user.roles) && auth.user.roles.length > 0;
    if (!hasToken || !hasUserWithRoles) return null;
    return getRoleHome(auth.user!);
  }, [location.pathname]);

  if (redirectTo && redirectTo !== location.pathname) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
