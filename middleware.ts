import { NextResponse, type NextRequest } from "next/server";
import { buildLoginNextParam, getSafeNextPath } from "@/lib/auth/next-path";
import {
  isAuthRoute,
  isProtectedRoute,
  isPublicRoute,
} from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  if (pathname === "/peers/workforce") {
    return NextResponse.redirect(new URL("/peers", request.url), 308);
  }

  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/auth/post-login", request.url));
  }

  if (user && isAuthRoute(pathname)) {
    const safeNext = getSafeNextPath(request.nextUrl.searchParams.get("next"));
    if (safeNext) {
      return NextResponse.redirect(new URL(safeNext, request.url));
    }

    return NextResponse.redirect(new URL("/auth/post-login", request.url));
  }

  if (!user && isProtectedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set(
      "next",
      buildLoginNextParam(pathname, search)
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && !isPublicRoute(pathname) && !isAuthRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set(
      "next",
      buildLoginNextParam(pathname, search)
    );
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
