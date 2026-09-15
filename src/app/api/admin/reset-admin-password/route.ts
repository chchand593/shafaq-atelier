import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// GET /api/admin/reset-admin-password?secret=YOUR_SETUP_SECRET
// Forcibly resets the admin@shafaqatelier.pk password to "Admin@123456".
// Protected by SETUP_SECRET env var.
// Idempotent — safe to run multiple times.

const ADMIN_EMAIL = "admin@shafaqatelier.pk";
const NEW_PASSWORD = "Admin@123456";

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
    // Find the admin user
    const admin = await db.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!admin) {
      // Admin doesn't exist — create it
      const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
      await db.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: "ShafaQ Admin",
          role: "admin",
          passwordHash,
        },
      });

      return htmlSuccess("Admin user CREATED", "The admin user did not exist. It has been created with the default password.");
    }

    // Admin exists — reset password
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
    await db.user.update({
      where: { id: admin.id },
      data: { passwordHash, role: "admin", name: "ShafaQ Admin" },
    });

    // Verify the new hash works
    const verifyUser = await db.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { passwordHash: true },
    });
    let verifyResult = "UNKNOWN";
    if (verifyUser) {
      const isValid = await bcrypt.compare(NEW_PASSWORD, verifyUser.passwordHash);
      verifyResult = isValid ? "✅ Password verified — bcrypt.compare returns TRUE" : "❌ Password verification FAILED";
    }

    return htmlSuccess("Password reset successful", `Admin password has been reset to "${NEW_PASSWORD}". ${verifyResult}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return htmlResponse("Reset Failed", msg, 500);
  }
}

function htmlSuccess(title: string, message: string) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ShafaQ Atelier — ${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#1a1a1a;margin:0;padding:40px 20px}.container{max-width:600px;margin:0 auto}h1{font-size:28px;font-weight:600;margin:0 0 24px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:16px}.creds{background:#f4f4f5;border-radius:8px;padding:16px;margin-top:16px}.creds p{margin:4px 0;font-size:14px}.warning{background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:13px}a{color:#c9a24b}</style></head><body><div class="container"><h1>✅ ${title}</h1><div class="card"><p>${message}</p><div class="creds"><p><strong>Email:</strong> ${ADMIN_EMAIL}</p><p><strong>Password:</strong> ${NEW_PASSWORD}</p></div><p style="margin-top:16px;font-size:14px">Go to <a href="/admin">/admin</a> to login.</p></div><div class="warning">⚠️ After login, remove SETUP_SECRET from Vercel to disable reset routes.</div></div></body></html>`;
  return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function htmlResponse(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:sans-serif;padding:40px"><h1>${title}</h1><p>${message}</p></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
