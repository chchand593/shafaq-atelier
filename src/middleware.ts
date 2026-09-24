// Server-side middleware for admin route protection.
// Unauthenticated users → redirect to home.
// Customer users → redirect to home with error.
// Admin users → allow access.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Resolve the NextAuth secret. In production we MUST fail loudly if it is
// missing — silently falling back to a hard-coded string would let anyone
// forge JWTs and bypass admin protection.
function resolveNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET is missing or too short (min 16 chars). Set a strong random value in your production environment."
    );
  }
  return "shafaq-atelier-dev-secret-change-me";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Get the NextAuth JWT token from the request
  // IMPORTANT: auth.ts overrides the session cookie name to
  // "next-auth.session-token" (no __Secure- prefix) so SameSite=None
  // cookies work in the Z.ai preview iframe. Without this explicit
  // cookieName, getToken defaults to "__Secure-next-auth.session-token"
  // on Vercel/HTTPS and never finds the actual cookie — breaking
  // /admin/* access for valid admin sessions in production.
  const token = await getToken({
    req: request,
    secret: resolveNextAuthSecret(),
    cookieName: "next-auth.session-token",
  });

  // Unauthenticated → redirect to home
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("admin_error", "auth");
    return NextResponse.redirect(url);
  }

  // Non-admin → redirect to home with error
  if (token.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("admin_error", "denied");
    return NextResponse.redirect(url);
  }

  // Admin → allow
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
