export function isDevPlaygroundEnabled() {
  return process.env.NODE_ENV === "development";
}

export function isDevRoute(pathname: string) {
  return (
    pathname === "/dev" ||
    pathname.startsWith("/dev/") ||
    pathname === "/studio-shell-preview" ||
    pathname === "/design-preview/hq" ||
    pathname.startsWith("/design-preview/hq-")
  );
}
