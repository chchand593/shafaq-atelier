import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/delete-duplicate-admins?secret=YOUR_SETUP_SECRET
//
// Browser-friendly route that deletes duplicate admin users, keeping only
// the canonical admin@shafaqatelier.pk (or, if not present, the oldest
// admin by createdAt). Useful for cleaning up the legacy
// admin@laylamodest.pk user left by an older setup script.
//
// Security: protected by SETUP_SECRET env var (same as /api/admin/setup
// and /api/admin/fix-schema).
// Idempotent — safe to call multiple times. If only one admin remains, the
// route reports "no dedupe needed" and exits.
//
// After this route returns success, hit /api/admin/debug to confirm only
// one admin remains.

const CANONICAL_EMAIL = "admin@shafaqatelier.pk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expectedSecret = process.env.SETUP_SECRET;

  if (!expectedSecret) {
    return htmlResponse("SETUP_SECRET not configured", "Add SETUP_SECRET in Vercel → Settings → Environment Variables", 500);
  }
  if (secret !== expectedSecret) {
    return htmlResponse("Unauthorized", "Wrong or missing ?secret= parameter", 401);
  }

  try {
    // 1. List all admins (oldest first)
    const admins = await db.user.findMany({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    // 2. If 0 or 1 admins, no dedupe needed
    if (admins.length <= 1) {
      const listHtml = admins.length === 0
        ? "<p>No admin users found.</p>"
        : `<p>Only one admin user exists:</p>
           <p>✅ <strong>${admins[0].email}</strong> (${admins[0].name})</p>`;
      return htmlSuccess(
        "No dedupe needed",
        `<p>Found ${admins.length} admin(s) — no duplicates to delete.</p>${listHtml}`
      );
    }

    // 3. Pick the canonical admin
    const canonical = admins.find((a) => a.email.toLowerCase() === CANONICAL_EMAIL) ?? admins[0];
    const duplicates = admins.filter((a) => a.id !== canonical.id);

    // 4. Delete every other admin
    let deleted = 0;
    const deletedEmails: string[] = [];
    const failedDeletes: { email: string; error: string }[] = [];

    for (const dup of duplicates) {
      try {
        await db.user.delete({ where: { id: dup.id } });
        deleted++;
        deletedEmails.push(dup.email);
      } catch (e) {
        failedDeletes.push({
          email: dup.email,
          error: e instanceof Error ? e.message.substring(0, 100) : "Unknown error",
        });
      }
    }

    // 5. Verify final state
    const remaining = await db.user.findMany({
      where: { role: "admin" },
      select: { email: true, name: true },
    });

    const beforeList = admins.map((a) => `<li>${a.email === canonical.email ? "✅ <strong>KEPT</strong> " : "❌ deleted "}<code>${a.email}</code> (${a.name}) — created ${a.createdAt.toISOString()}</li>`).join("");
    const afterList = remaining.length > 0
      ? remaining.map((a) => `<li>✅ <code>${a.email}</code> (${a.name})</li>`).join("")
      : "<li>⚠️ No admin users remaining</li>";

    const summary = `Before: ${admins.length} admins → After: ${remaining.length} admin(s). Deleted ${deleted} duplicate(s).`;
    const message = `
      <p><strong>Canonical (kept):</strong> <code>${canonical.email}</code></p>
      <p><strong>${deleted} duplicate(s) deleted:</strong> ${deletedEmails.map((e) => `<code>${e}</code>`).join(", ") || "—"}</p>
      ${failedDeletes.length > 0 ? `<p><strong>Failed deletes:</strong> ${failedDeletes.map((f) => `<code>${f.email}</code> (${f.error})`).join(", ")}</p>` : ""}
      <p style="margin-top:12px"><strong>Before:</strong></p>
      <ul style="margin:6px 0 12px 20px;padding:0;list-style:disc">${beforeList}</ul>
      <p><strong>After:</strong></p>
      <ul style="margin:6px 0 12px 20px;padding:0;list-style:disc">${afterList}</ul>
      <p style="margin-top:12px;color:#666;font-size:13px">${summary}</p>
    `;

    return htmlSuccess(`Dedupe complete — ${summary}`, message);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return htmlResponse("Delete Failed", msg, 500);
  }
}

function htmlSuccess(title: string, message: string) {
  const debugUrl = `${process.env.NEXTAUTH_URL || ""}/api/admin/debug`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ShafaQ Atelier — ${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#1a1a1a;margin:0;padding:40px 20px}.container{max-width:700px;margin:0 auto}h1{font-size:28px;font-weight:600;margin:0 0 8px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:16px}.card p{margin:6px 0}code{font-family:monospace;background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px}.cta{display:inline-block;padding:10px 18px;background:#1a1a1a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:12px}.warning{background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:13px}a{color:#c9a24b}</style></head><body><div class="container"><h1>✅ ${title}</h1><p style="color:#666;margin:0 0 24px;font-size:14px">Generated at ${new Date().toISOString()}</p><div class="card">${message}</div><div class="card" style="background:#dcfce7;border-color:#86efac"><p style="font-weight:600;margin:0 0 8px">Next step</p><p style="font-size:14px;margin:0 0 8px">Verify only one admin remains:</p><a href="${debugUrl}" class="cta">Re-check Debug →</a></div><div class="warning">⚠️ <strong>Security:</strong> After everything works, remove <code>SETUP_SECRET</code> from Vercel to disable this route.</div></div></body></html>`;
  return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function htmlResponse(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:sans-serif;padding:40px"><h1>${title}</h1><p>${message}</p></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
