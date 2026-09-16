import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/whoami
//
// PUBLIC diagnostic route (no SETUP_SECRET required) — used by the admin
// panel and the browser to verify whether the current request is carrying
// a valid NextAuth session. Useful for debugging the
// `?admin_error=auth` redirect loop the user reported.
//
// Returns:
//   200 OK + JSON when a session exists:
//   {
//     authenticated: true,
//     user: { id, email, name, role },
//     session: { expires, strategy },
//     timestamp
//   }
//
//   200 OK + JSON when no session:
//   {
//     authenticated: false,
//     user: null,
//     session: null,
//     timestamp
//   }
//
// Note: 200 is returned in BOTH cases so the browser can call this from
// client code without try/catch — the `authenticated` flag is the source
// of truth.

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          session: null,
          timestamp: new Date().toISOString(),
        },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const user = session.user as { id?: string; email?: string; name?: string; role?: string };

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id ?? null,
          email: user.email ?? null,
          name: user.name ?? null,
          role: user.role ?? "customer",
        },
        session: {
          expires: session.expires ?? null,
          strategy: "jwt",
        },
        isAdmin: user.role === "admin",
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        session: null,
        error: msg,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
