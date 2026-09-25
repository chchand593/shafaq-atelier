import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/delete-duplicate-admins?secret=YOUR_SETUP_SECRET
//
// NON-DESTRUCTIVE: Reports all admin users. Does NOT delete any users.
// This route was previously used to automatically delete duplicate admin
// accounts, but per the zero-data-loss requirement, it now only REPORTS
// them. The site owner can manually remove duplicates via the Neon SQL
// Editor or the admin panel if desired.
//
// Security: protected by SETUP_SECRET env var.

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
    const admins = await db.user.findMany({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const adminList = admins
      .map((a) => `<li>${a.email.toLowerCase() === CANONICAL_EMAIL ? "✅ <strong>CANONICAL</strong> " : "⚠️ "}<code>${a.email}</code> (${a.name}) — created ${a.createdAt.toISOString()}</li>`)
      .join("");

    const hasDuplicates = admins.length > 1;
    const title = hasDuplicates
      ? `${admins.length} admin users found — duplicates detected (NOT deleted)`
      : `${admins.length} admin user — no duplicates`;

    const message = `
      <p>Found <strong>${admins.length} admin user(s)</strong>. No users were deleted.</p>
      <p style="margin-top:12px"><strong>Admin list:</strong></p>
      <ul style="margin:6px 0 12px 20px;padding:0;list-style:disc">${adminList}</ul>
      ${hasDuplicates ? `
        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:12px;font-size:13px">
          <p style="font-weight:600;margin:0 0 8px">⚠️ Duplicate admins detected</p>
          <p style="margin:0">The canonical admin is <code>${CANONICAL_EMAIL}</code>. To manually remove duplicate admins, use the Neon SQL Editor:</p>
          <code style="display:block;background:#fff;padding:12px;border-radius:6px;font-size:12px;margin-top:8px;word-break:break-all">
            UPDATE "User" SET "role" = 'customer' WHERE "email" != '${CANONICAL_EMAIL}' AND "role" = 'admin';
          </code>
          <p style="margin:8px 0 0;font-size:12px;color:#666">This downgrades duplicates to customers — no data loss, no deletion.</p>
        </div>
      ` : `<p style="color:#22c55e;font-weight:600;margin-top:12px">✅ No duplicate admins detected.</p>`}
    `;

    return htmlSuccess(title, message);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return htmlResponse("Report Failed", msg, 500);
  }
}

function htmlSuccess(title: string, message: string) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ShafaQ Atelier — ${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#1a1a1a;margin:0;padding:40px 20px}.container{max-width:700px;margin:0 auto}h1{font-size:28px;font-weight:600;margin:0 0 8px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:16px}.card p{margin:6px 0}code{font-family:monospace;background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px}a{color:#c9a24b}</style></head><body><div class="container"><h1>✅ ${title}</h1><p style="color:#666;margin:0 0 24px;font-size:14px">Generated at ${new Date().toISOString()}</p><div class="card">${message}</div></div></body></html>`;
  return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function htmlResponse(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:sans-serif;padding:40px"><h1>${title}</h1><p>${message}</p></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
