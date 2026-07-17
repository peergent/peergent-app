export function isDevPlaygroundEnabled() {
  return process.env.NODE_ENV === "development";
}

export function isDevRoute(pathname: string) {
  return pathname === "/dev" || pathname.startsWith("/dev/");
}
