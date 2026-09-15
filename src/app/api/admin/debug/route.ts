import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// GET /api/admin/debug
// No auth required — diagnostic only. Shows database connection, tables,
// admin user, password verification, product counts, and environment info.

export async function GET() {
  const checks: { label: string; status: "ok" | "fail"; detail: string }[] = [];
  let adminDetails = "";
  let allAdmins = "";

  // 1. Database connection
  try {
    await db.$queryRaw`SELECT 1`;
    checks.push({ label: "Database Connection", status: "ok", detail: "Connected" });
  } catch (e) {
    checks.push({
      label: "Database Connection",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Unknown error",
    });
  }

  // 2. User table
  try {
    const count = await db.user.count();
    checks.push({ label: "User Table", status: "ok", detail: `${count} users` });
  } catch (e) {
    checks.push({
      label: "User Table",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Table missing",
    });
  }

  // 3. Admin user + password verification
  try {
    const admin = await db.user.findUnique({
      where: { email: "admin@shafaqatelier.pk" },
      select: { email: true, role: true, name: true, passwordHash: true },
    });

    if (admin) {
      // Check password hash format
      const hashPrefix = admin.passwordHash?.substring(0, 20) || "NONE";
      const hashLength = admin.passwordHash?.length || 0;

      // Test bcrypt.compare with the known password
      let passwordCheck = "UNKNOWN";
      try {
        const isValid = await bcrypt.compare("Admin@123456", admin.passwordHash);
        passwordCheck = isValid ? "✅ MATCH" : "❌ MISMATCH";
      } catch (e) {
        passwordCheck = `❌ ERROR: ${e instanceof Error ? e.message.substring(0, 100) : "unknown"}`;
      }

      checks.push({
        label: "Admin User",
        status: "ok",
        detail: `Found: ${admin.email} (role: ${admin.role})`,
      });

      checks.push({
        label: "Password Verify (Admin@123456)",
        status: passwordCheck.includes("✅") ? "ok" : "fail",
        detail: `${passwordCheck} | hash: ${hashPrefix}... (${hashLength} chars)`,
      });

      adminDetails = `
        <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-top:12px;font-size:13px">
          <p><strong>Email:</strong> ${admin.email}</p>
          <p><strong>Role:</strong> ${admin.role}</p>
          <p><strong>Name:</strong> ${admin.name}</p>
          <p><strong>Hash prefix:</strong> <code>${hashPrefix}...</code> (${hashLength} chars)</p>
          <p><strong>Password "Admin@123456":</strong> ${passwordCheck}</p>
        </div>`;
    } else {
      checks.push({
        label: "Admin User",
        status: "fail",
        detail: "NOT FOUND — run /api/admin/setup?secret=YOUR_SECRET",
      });
    }
  } catch (e) {
    checks.push({
      label: "Admin User",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Query failed",
    });
  }

  // 3b. List ALL admin users (check for duplicates)
  try {
    const admins = await db.user.findMany({
      where: { role: "admin" },
      select: { email: true, role: true, name: true },
    });
    if (admins.length > 0) {
      const adminList = admins.map((a) => `${a.email} (${a.name})`).join(", ");
      checks.push({
        label: "All Admin Users",
        status: admins.length === 1 ? "ok" : "fail",
        detail: `${admins.length} admin(s): ${adminList}`,
      });
      allAdmins = `
        <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin-top:12px;font-size:13px">
          <p><strong>Admin users (${admins.length}):</strong></p>
          ${admins.map((a) => `<p>• ${a.email} — ${a.name} — role: ${a.role}</p>`).join("")}
          ${admins.length > 1 ? '<p style="color:#ef4444;font-weight:600">⚠️ Duplicate admin users found!</p>' : ""}
        </div>`;
    }
  } catch {
    // skip
  }

  // 4. Product table
  try {
    const count = await db.product.count();
    const active = await db.product.count({ where: { active: true } });
    checks.push({
      label: "Product Table",
      status: "ok",
      detail: `${count} total, ${active} active`,
    });
  } catch (e) {
    checks.push({
      label: "Product Table",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Table missing",
    });
  }

  // 5. New Arrivals
  try {
    const count = await db.product.count({
      where: { active: true, isNewArrival: true },
    });
    checks.push({
      label: "New Arrivals (isNewArrival=true)",
      status: count > 0 ? "ok" : "fail",
      detail: `${count} products`,
    });
  } catch (e) {
    checks.push({
      label: "New Arrivals",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Query failed",
    });
  }

  // 6. Best Sellers
  try {
    const count = await db.product.count({
      where: { active: true, isBestSeller: true },
    });
    checks.push({
      label: "Best Sellers (isBestSeller=true)",
      status: count > 0 ? "ok" : "fail",
      detail: `${count} products`,
    });
  } catch (e) {
    checks.push({
      label: "Best Sellers",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Query failed",
    });
  }

  // 7-10. Other tables
  const tableChecks = [
    { model: "color", label: "Color Table" },
    { model: "fabric", label: "Fabric Table" },
    { model: "customizationOption", label: "CustomizationOption Table" },
    { model: "abayaStyle", label: "AbayaStyle Table" },
  ];
  for (const tc of tableChecks) {
    try {
      const count = await (db as any)[tc.model].count();
      checks.push({ label: tc.label, status: "ok", detail: `${count} records` });
    } catch (e) {
      checks.push({
        label: tc.label,
        status: "fail",
        detail: e instanceof Error ? e.message.substring(0, 200) : "Table missing",
      });
    }
  }

  // 11. Environment variables
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "SET" : "MISSING",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "MISSING",
    SETUP_SECRET: process.env.SETUP_SECRET ? "SET" : "MISSING",
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? "SET" : "MISSING",
  };

  // Build HTML
  const checksHtml = checks
    .map(
      (c) => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0">
      <span style="font-size:24px;flex-shrink:0">${c.status === "ok" ? "✅" : "❌"}</span>
      <div>
        <div style="font-weight:600;font-size:15px">${c.label}</div>
        <div style="font-size:13px;color:#666;margin-top:2px">${c.detail}</div>
      </div>
    </div>`
    )
    .join("");

  const envHtml = Object.entries(envVars)
    .map(
      ([key, val]) => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0">
        <span style="font-family:monospace;font-size:13px">${key}</span>
        <span style="font-size:13px;font-weight:600;color:${val === "SET" ? "#22c55e" : "#ef4444"}">${val}</span>
      </div>`
    )
    .join("");

  const passwordFail = checks.find((c) => c.label === "Password Verify (Admin@123456)")?.status === "fail";
  const adminExists = checks.find((c) => c.label === "Admin User")?.status === "ok";

  const actionHtml = passwordFail
    ? `<div style="background:#fee2e2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-top:16px">
         <p style="font-weight:600;margin:0 0 8px">❌ Password mismatch detected</p>
         <p style="margin:0 0 12px;font-size:14px">Reset the admin password by visiting:</p>
         <code style="display:block;background:#fff;padding:12px;border-radius:6px;font-size:13px;word-break:break-all">
           ${process.env.NEXTAUTH_URL || "https://your-site.vercel.app"}/api/admin/reset-admin-password?secret=YOUR_SETUP_SECRET
         </code>
       </div>`
    : !adminExists
      ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:16px">
           <p style="font-weight:600;margin:0 0 8px">⚠️ Admin user not found</p>
           <p style="margin:0 0 12px;font-size:14px">Run setup:</p>
           <code style="display:block;background:#fff;padding:12px;border-radius:6px;font-size:13px;word-break:break-all">
             ${process.env.NEXTAUTH_URL || "https://your-site.vercel.app"}/api/admin/setup?secret=YOUR_SETUP_SECRET
           </code>
         </div>`
      : `<div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:16px;margin-top:16px">
           <p style="font-weight:600;margin:0">✅ Everything looks good!</p>
           <p style="margin:8px 0 0;font-size:14px">Login at <a href="/admin" style="color:#c9a24b">/admin</a> with admin@shafaqatelier.pk / Admin@123456</p>
         </div>`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ShafaQ Atelier — Debug</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#1a1a1a;margin:0;padding:40px 20px}.container{max-width:700px;margin:0 auto}h1{font-size:24px;font-weight:600;margin:0 0 8px}h2{font-size:18px;font-weight:600;margin:24px 0 8px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:16px}code{font-family:monospace}a{color:#c9a24b}</style></head><body><div class="container"><h1>🔧 ShafaQ Atelier — Debug Report</h1><p style="color:#666;margin:0 0 24px;font-size:14px">Generated at ${new Date().toISOString()}</p><div class="card"><h2>Database Checks</h2>${checksHtml}${adminDetails}${allAdmins}</div><div class="card"><h2>Environment Variables</h2>${envHtml}</div>${actionHtml}</div></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
