import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runFixSchema, type FixStep } from "@/lib/fix-schema";

export const dynamic = "force-dynamic";

// GET /api/admin/fix-schema?secret=YOUR_SETUP_SECRET
//
// Browser-friendly schema fixer for the ShafaQ Atelier production database.
// Adds the missing columns (Product.isNewArrival / isBestSeller / isFeatured /
// colorImages) and creates the missing tables (Color, Fabric,
// CustomizationOption, AbayaStyle, AbayaImage) identified by /api/admin/debug.
//
// Security: protected by SETUP_SECRET env var (same as /api/admin/setup).
// Idempotent — safe to call multiple times. Already-present columns/tables
// are skipped.
//
// After this route returns success, hit /api/admin/setup?secret=YOUR_SETUP_SECRET
// to populate the new tables with colors / fabrics / options / styles.

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

  let steps: FixStep[] = [];
  try {
    steps = await runFixSchema();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return htmlResponse("Fix Failed", msg, 500);
  }

  // Post-fix verification — re-check the same things /api/admin/debug checks.
  const verify: { label: string; ok: boolean; detail: string }[] = [];
  const cols = ["isNewArrival", "isBestSeller", "isFeatured", "colorImages"];
  for (const col of cols) {
    try {
      await db.product.findFirst({ select: { [col]: true } as any });
      verify.push({ label: `Product.${col}`, ok: true, detail: "Queryable" });
    } catch (e) {
      verify.push({ label: `Product.${col}`, ok: false, detail: (e as Error).message.substring(0, 120) });
    }
  }
  const tables = ["color", "fabric", "customizationOption", "abayaStyle", "abayaImage"];
  for (const t of tables) {
    try {
      await (db as any)[t].count();
      verify.push({ label: `${t} table`, ok: true, detail: "Queryable" });
    } catch (e) {
      verify.push({ label: `${t} table`, ok: false, detail: (e as Error).message.substring(0, 120) });
    }
  }

  const failCount = steps.filter((s) => s.status === "fail").length;
  const allVerifyOk = verify.every((v) => v.ok);

  const stepsHtml = steps.map((s) => {
    const icon = s.status === "ok" ? "✓" : s.status === "skip" ? "•" : "✗";
    const color = s.status === "ok" ? "#22c55e" : s.status === "skip" ? "#9ca3af" : "#ef4444";
    return `<div style="display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid #f0f0f0"><span style="color:${color};font-size:18px;flex-shrink:0;font-weight:700">${icon}</span><div style="flex:1"><div style="font-weight:600;font-size:14px">${s.label}</div><div style="font-size:13px;color:#666;margin-top:2px">${s.detail}</div></div></div>`;
  }).join("");

  const verifyHtml = verify.map((v) => {
    const color = v.ok ? "#22c55e" : "#ef4444";
    return `<div style="display:flex;align-items:flex-start;gap:12px;padding:6px 0"><span style="color:${color};font-size:18px;flex-shrink:0;font-weight:700">${v.ok ? "✓" : "✗"}</span><div style="flex:1"><div style="font-weight:600;font-size:13px">${v.label}</div><div style="font-size:12px;color:#666;margin-top:2px">${v.detail}</div></div></div>`;
  }).join("");

  const summary = `${steps.filter(s => s.status === "ok").length} added, ${steps.filter(s => s.status === "skip").length} skipped, ${failCount} failed`;
  const title = allVerifyOk && failCount === 0 ? "✅ Schema Fixed" : failCount === 0 && !allVerifyOk ? "⚠️ Partially Fixed" : "❌ Fix Failed";

  const nextStepUrl = `${process.env.NEXTAUTH_URL || ""}/api/admin/setup?secret=${encodeURIComponent(secret || "")}`;
  const debugUrl = `${process.env.NEXTAUTH_URL || ""}/api/admin/debug`;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ShafaQ Atelier — Fix Schema</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#1a1a1a;margin:0;padding:40px 20px}.container{max-width:700px;margin:0 auto}h1{font-size:28px;font-weight:600;margin:0 0 8px}h2{font-size:18px;font-weight:600;margin:24px 0 8px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:16px}.summary{display:inline-block;padding:4px 12px;border-radius:999px;background:#f4f4f5;font-size:13px;font-weight:600;margin-bottom:16px}.cta{display:inline-block;padding:12px 20px;background:#1a1a1a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:8px 8px 0 0}.cta-secondary{background:#fff;color:#1a1a1a;border:1px solid #e4e4e7}.warning{background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:13px}a{color:#c9a24b}code{font-family:monospace;background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:12px}</style></head><body><div class="container"><h1>${title}</h1><p style="color:#666;margin:0 0 24px;font-size:14px">Generated at ${new Date().toISOString()}</p><div class="card"><h2>Fix Steps</h2><span class="summary">${summary}</span>${stepsHtml}</div><div class="card"><h2>Post-Fix Verification</h2>${verifyHtml}</div>${allVerifyOk && failCount === 0 ? `<div class="card" style="background:#dcfce7;border-color:#86efac"><h2 style="margin-top:0">Next step — populate the new tables</h2><p style="font-size:14px;margin:0 0 12px">Now hit the setup route to fill the new Color / Fabric / CustomizationOption / AbayaStyle / AbayaImage tables with seed data:</p><code style="display:block;background:#fff;padding:12px;border-radius:6px;font-size:13px;word-break:break-all">${nextStepUrl}</code><a href="${nextStepUrl}" class="cta">Run Setup Now →</a><a href="${debugUrl}" class="cta cta-secondary">Re-check Debug →</a></div>` : `<div class="warning">⚠️ Some steps failed. As a fallback, run <code>bun run prisma db push --accept-data-loss</code> against the production DATABASE_URL.</div>`}<div class="warning">⚠️ <strong>Security:</strong> After everything works, remove <code>SETUP_SECRET</code> from Vercel to disable this route.</div></div></body></html>`;

  return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function htmlResponse(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:sans-serif;padding:40px"><h1>${title}</h1><p>${message}</p></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
