import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/subscribe
//
// Public newsletter subscription endpoint. Persists the email into the
// NewsletterSubscriber table (idempotent — re-subscribing the same email
// just reactivates the existing row). Returns a small JSON payload.
//
// Request body: { email: string, name?: string, source?: string }
// Response 200: { ok: true, message: "Subscribed" }
// Response 400: { ok: false, error: "Invalid email" }
// Response 500: { ok: false, error: "..." }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as
      | { email?: string; name?: string; source?: string }
      | null;

    const email = (body?.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const name = (body?.name || "").trim().slice(0, 120) || null;
    const source = (body?.source || "homepage").trim().slice(0, 40);

    // Upsert — if the email already exists, reactivate + update name.
    await db.newsletterSubscriber.upsert({
      where: { email },
      update: { active: true, name, source },
      create: { email, name, source, active: true },
    });

    return NextResponse.json(
      { ok: true, message: "Subscribed — welcome to ShafaQ Atelier." },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Subscription failed: ${msg.substring(0, 120)}` },
      { status: 500 }
    );
  }
}

// GET /api/subscribe — health/info endpoint (does NOT list subscribers
// publicly; that's admin-only via /api/admin/newsletter).
export async function GET() {
  return NextResponse.json(
    { ok: true, endpoint: "/api/subscribe", method: "POST" },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
