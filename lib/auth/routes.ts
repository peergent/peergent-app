export const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export const PUBLIC_ROUTES = [
  "/",
  "/auth/callback",
  "/auth/confirm",
] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/peers",
  "/knowledge",
  "/integrations",
  "/settings",
  "/website-intelligence",
] as const;

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
