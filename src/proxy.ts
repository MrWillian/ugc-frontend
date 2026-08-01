import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-server";

const protectedPrefixes = ["/dashboard", "/campaigns", "/widgets"];
const publicPaths = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const protectedPath = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (protectedPath && !authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (publicPaths.has(pathname) && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/campaigns/:path*", "/widgets/:path*", "/login", "/signup"],
};
