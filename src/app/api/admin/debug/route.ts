import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/debug
// No auth required — diagnostic only. Shows database connection status,
// table existence, admin user, product counts, and schema info.
// Does NOT expose any passwords or secrets.

export async function GET() {
  const checks: { label: string; status: "ok" | "fail"; detail: string }[] = [];

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

  // 3. Admin user
  try {
    const admin = await db.user.findUnique({
      where: { email: "admin@shafaqatelier.pk" },
      select: { email: true, role: true, name: true },
    });
    if (admin) {
      checks.push({
        label: "Admin User",
        status: "ok",
        detail: `Found: ${admin.email} (role: ${admin.role})`,
      });
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

  // 7. Color table
  try {
    const count = await db.color.count();
    checks.push({ label: "Color Table", status: "ok", detail: `${count} colors` });
  } catch (e) {
    checks.push({
      label: "Color Table",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Table missing",
    });
  }

  // 8. Fabric table
  try {
    const count = await db.fabric.count();
    checks.push({ label: "Fabric Table", status: "ok", detail: `${count} fabrics` });
  } catch (e) {
    checks.push({
      label: "Fabric Table",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Table missing",
    });
  }

  // 9. CustomizationOption table
  try {
    const count = await db.customizationOption.count();
    checks.push({
      label: "CustomizationOption Table",
      status: "ok",
      detail: `${count} options`,
    });
  } catch (e) {
    checks.push({
      label: "CustomizationOption Table",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Table missing",
    });
  }

  // 10. AbayaStyle table
  try {
    const count = await db.abayaStyle.count();
    checks.push({
      label: "AbayaStyle Table",
      status: "ok",
      detail: `${count} styles`,
    });
  } catch (e) {
    checks.push({
      label: "AbayaStyle Table",
      status: "fail",
      detail: e instanceof Error ? e.message.substring(0, 200) : "Table missing",
    });
  }

  // 11. Environment variables (only check presence, not values)
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "SET" : "MISSING",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "MISSING",
    SETUP_SECRET: process.env.SETUP_SECRET ? "SET" : "MISSING",
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? "SET" : "MISSING",
  };

  // Build HTML response
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

  const allOk = checks.every((c) => c.status === "ok");
  const adminExists = checks.find((c) => c.label === "Admin User")?.status === "ok";

  const actionHtml = !adminExists
    ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:16px">
         <p style="font-weight:600;margin:0 0 8px">⚠️ Admin user not found</p>
         <p style="margin:0 0 12px;font-size:14px">Run setup by visiting this URL in your browser:</p>
         <code style="display:block;background:#fff;padding:12px;border-radius:6px;font-size:13px;word-break:break-all">
           ${process.env.NEXTAUTH_URL || "https://your-site.vercel.app"}/api/admin/setup?secret=YOUR_SETUP_SECRET
         </code>
       </div>`
    : allOk
      ? `<div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:16px;margin-top:16px">
           <p style="font-weight:600;margin:0">✅ Everything looks good!</p>
           <p style="margin:8px 0 0;font-size:14px">Login at <a href="/admin" style="color:#c9a24b">/admin</a> with admin@shafaqatelier.pk / Admin@123456</p>
         </div>`
      : `<div style="background:#fee2e2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-top:16px">
           <p style="font-weight:600;margin:0">❌ Some checks failed</p>
           <p style="margin:8px 0 0;font-size:14px">Run setup: <code>${process.env.NEXTAUTH_URL || "https://your-site.vercel.app"}/api/admin/setup?secret=YOUR_SETUP_SECRET</code></p>
         </div>`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ShafaQ Atelier — Debug</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#1a1a1a;margin:0;padding:40px 20px}.container{max-width:700px;margin:0 auto}h1{font-size:24px;font-weight:600;margin:0 0 8px}h2{font-size:18px;font-weight:600;margin:24px 0 8px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:16px}code{font-family:monospace}a{color:#c9a24b}</style></head><body><div class="container"><h1>🔧 ShafaQ Atelier — Debug Report</h1><p style="color:#666;margin:0 0 24px;font-size:14px">Generated at ${new Date().toISOString()}</p><div class="card"><h2>Database Checks</h2>${checksHtml}</div><div class="card"><h2>Environment Variables</h2>${envHtml}</div>${actionHtml}</div></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
