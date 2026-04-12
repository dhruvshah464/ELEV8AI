export const AUTH_PAGES = ["/login", "/signup"] as const;
export const PUBLIC_PATHS = ["/", ...AUTH_PAGES, "/auth/callback"] as const;
export const PROTECTED_PATHS = [
  "/dashboard",
  "/mission",
  "/tasks",
  "/resume",
  "/interview",
  "/career",
  "/career/pipeline",
  "/career/evaluate",
  "/career/tracker",
] as const;
export const ONBOARDING_PATH = "/onboarding";
export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

export function matchesPath(pathname: string, routes: readonly string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function sanitizeRedirectPath(pathname?: string | null) {
  if (!pathname) return null;
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return null;
  if (matchesPath(pathname, PUBLIC_PATHS)) return null;
  return pathname;
}

export function getPostAuthPath(options?: {
  onboarded?: boolean | null;
  nextPath?: string | null;
}) {
  const onboarded = Boolean(options?.onboarded);
  const safeNext = sanitizeRedirectPath(options?.nextPath);

  if (onboarded) {
    return safeNext ?? DEFAULT_AUTHENTICATED_PATH;
  }

  return ONBOARDING_PATH;
}

export function buildLoginPath(nextPath?: string | null) {
  const safeNext = sanitizeRedirectPath(nextPath);

  if (!safeNext) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(safeNext)}`;
}
