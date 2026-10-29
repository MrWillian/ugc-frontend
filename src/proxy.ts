import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-server";
import { RETURN_TO_PARAM, safeRedirectPath } from "@/lib/redirect";

const protectedPrefixes = [
  "/dashboard",
  "/campaigns",
  "/widgets",
  "/posts",
  "/moderation",
  "/settings",
  "/auth/instagram/callback",
];
const publicPaths = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const protectedPath = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (protectedPath && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(RETURN_TO_PARAM, `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }
  if (publicPaths.has(pathname) && authenticated) {
    const returnTo = safeRedirectPath(request.nextUrl.searchParams.get(RETURN_TO_PARAM));
    return NextResponse.redirect(new URL(returnTo, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/campaigns/:path*",
    "/widgets/:path*",
    "/posts/:path*",
    "/moderation/:path*",
    "/settings/:path*",
    "/auth/instagram/callback",
    "/login",
    "/signup",
  ],
};
