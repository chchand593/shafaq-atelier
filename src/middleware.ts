// Server-side middleware for admin route protection.
// Unauthenticated users → redirect to home.
// Customer users → redirect to home with error.
// Admin users → allow access.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Resolve the NextAuth secret. In production, if the secret is missing
// (e.g. during build), log an error but don't throw — throwing would
// crash the middleware and break all /admin routes. At runtime, Vercel
// injects the real NEXTAUTH_SECRET and this function returns it.
function resolveNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    console.error(
      "NEXTAUTH_SECRET is missing or too short (min 16 chars). Set it in your Vercel environment variables."
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
  const token = await getToken({
    req: request,
    secret: resolveNextAuthSecret(),
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
