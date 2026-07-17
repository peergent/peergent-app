import { isAuthRoute } from "./routes";

const BLOCKED_PREFIXES = ["/auth/"] as const;

function isBlockedDestination(pathname: string) {
  if (pathname === "/") {
    return true;
  }

  if (isAuthRoute(pathname)) {
    return true;
  }

  return BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

/**
 * Validates a post-login redirect target.
 * Returns a safe internal path (with query string) or null.
 */
export function getSafeNextPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (/^https?:/i.test(trimmed) || trimmed.includes("\\")) {
    return null;
  }

  let pathname: string;
  let search: string;

  try {
    const parsed = new URL(trimmed, "http://localhost");
    pathname = parsed.pathname;
    search = parsed.search;
  } catch {
    return null;
  }

  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return null;
  }

  if (isBlockedDestination(pathname)) {
    return null;
  }

  return `${pathname}${search}`;
}

export function buildLoginNextParam(pathname: string, search = "") {
  return `${pathname}${search}`;
}
