/**
 * Unit checks for getSafeNextPath (Sprint 5.1.1 routing).
 * Usage: node scripts/test-next-path.mjs
 */

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

function isAuthRoute(pathname) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function getSafeNextPath(raw) {
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

  let pathname;
  let search;

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

  if (pathname === "/" || isAuthRoute(pathname) || pathname.startsWith("/auth/")) {
    return null;
  }

  return `${pathname}${search}`;
}

const cases = [
  { input: "/peers", expected: "/peers" },
  { input: "/peers/abc-123", expected: "/peers/abc-123" },
  { input: "/peers/abc?tab=work", expected: "/peers/abc?tab=work" },
  { input: "https://external-site.com", expected: null },
  { input: "//evil.com", expected: null },
  { input: "/login", expected: null },
  { input: "/signup", expected: null },
  { input: "/auth/post-login", expected: null },
  { input: "/", expected: null },
  { input: null, expected: null },
  { input: "", expected: null },
];

let failed = 0;

for (const { input, expected } of cases) {
  const result = getSafeNextPath(input);
  if (result !== expected) {
    console.error(
      `FAIL: getSafeNextPath(${JSON.stringify(input)}) => ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`
    );
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`${failed} test(s) failed.`);
  process.exit(1);
}

console.log(`All ${cases.length} getSafeNextPath checks passed.`);
