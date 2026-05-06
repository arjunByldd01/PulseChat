import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/invite",
  "/api/auth",
  "/api/auth/register",
];

export function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // NextAuth v5 (Auth.js) uses "authjs.*" cookie names; v4 used "next-auth.*"
  const sessionToken =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token") ??
    req.cookies.get("next-auth.session-token") ??
    req.cookies.get("__Secure-next-auth.session-token");

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
