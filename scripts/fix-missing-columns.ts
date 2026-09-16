// scripts/fix-missing-columns.ts
//
// Idempotent production schema fixer.
//
// Adds the missing columns and creates the missing tables identified by
// /api/admin/debug:
//
//   MISSING COLUMNS on Product:
//     • isNewArrival (Boolean, default false)
//     • isBestSeller (Boolean, default false)
//     • isFeatured   (Boolean, default false)  — already missing on prod
//     • colorImages  (Text,    default '[]')
//
//   MISSING TABLES:
//     • Color
//     • Fabric
//     • CustomizationOption
//     • AbayaStyle
//     • AbayaImage
//
// Idempotent: every step uses "IF NOT EXISTS" (Postgres) or pre-checks the
// schema before mutating it (SQLite). Running this script multiple times is
// safe — already-present columns/tables are skipped.
//
// USAGE:
//   1. Set DATABASE_URL to your production Neon PostgreSQL URL:
//        export DATABASE_URL="postgresql://user:pass@host/db?schema=public"
//   2. Run:
//        bun run scripts/fix-missing-columns.ts
//
// After this script succeeds, hit /api/admin/setup?secret=YOUR_SETUP_SECRET
// in the browser to populate the new tables with colors/fabrics/options/styles.

import { runFixSchema, type FixStep } from "../src/lib/fix-schema";
import { db } from "../src/lib/db";

async function main() {
  const url = process.env.DATABASE_URL || "";
  const isPg = url.startsWith("postgres://") || url.startsWith("postgresql://");
  console.log("=== ShafaQ Atelier — Fix Missing Columns / Tables ===\n");
  console.log(`Provider:  ${isPg ? "PostgreSQL" : "SQLite"}`);
  console.log(`Database:  ${url.substring(0, Math.min(40, url.length))}${url.length > 40 ? "..." : ""}`);
  console.log("");

  if (!url) {
    console.error("❌ DATABASE_URL is not set. Set it to your production Neon PostgreSQL URL and retry.");
    process.exit(1);
  }

  console.log("Running fix steps...\n");
  const steps: FixStep[] = await runFixSchema();

  // Print step results
  let okCount = 0;
  let skipCount = 0;
  let failCount = 0;
  for (const step of steps) {
    const icon = step.status === "ok" ? "✓" : step.status === "skip" ? "•" : "✗";
    const color = step.status === "ok" ? "\x1b[32m" : step.status === "skip" ? "\x1b[90m" : "\x1b[31m";
    console.log(`  ${color}${icon}\x1b[0m  ${step.label.padEnd(40)} ${step.detail}`);
    if (step.status === "ok") okCount++;
    else if (step.status === "skip") skipCount++;
    else failCount++;
  }

  console.log("");
  console.log(`Summary: ${okCount} ok, ${skipCount} skipped, ${failCount} failed`);

  if (failCount > 0) {
    console.error("\n❌ Some steps failed. Review the messages above.");
    process.exit(1);
  }

  // Post-fix verification — re-check the same things /api/admin/debug checks.
  console.log("\n=== Post-Fix Verification ===\n");
  const verify = await verifySchema();
  for (const v of verify) {
    console.log(`  ${v.ok ? "✓" : "✗"}  ${v.label.padEnd(40)} ${v.detail}`);
  }
  console.log("");

  const allOk = verify.every((v) => v.ok);
  if (allOk) {
    console.log("✅ Schema is in sync with prisma/schema.prisma");
    console.log("   Next: visit /api/admin/setup?secret=YOUR_SETUP_SECRET to populate colors / fabrics / options / styles.");
  } else {
    console.log("⚠️  Some checks still failing. Run `bun run prisma db push --accept-data-loss` as a fallback.");
    process.exit(1);
  }
}

async function verifySchema() {
  const out: { label: string; ok: boolean; detail: string }[] = [];

  // isNewArrival / isBestSeller / isFeatured / colorImages columns on Product.
  // Use findFirst with select — works regardless of column type (Boolean / Text)
  // and throws only if the column is missing.
  const cols = ["isNewArrival", "isBestSeller", "isFeatured", "colorImages"];
  for (const col of cols) {
    try {
      await db.product.findFirst({ select: { [col]: true } as any });
      out.push({ label: `Product.${col}`, ok: true, detail: "Queryable" });
    } catch (e) {
      out.push({ label: `Product.${col}`, ok: false, detail: (e as Error).message.substring(0, 120) });
    }
  }

  // Tables
  const tables = ["color", "fabric", "customizationOption", "abayaStyle", "abayaImage"];
  for (const t of tables) {
    try {
      await (db as any)[t].count();
      out.push({ label: `${t} table`, ok: true, detail: "Queryable" });
    } catch (e) {
      out.push({ label: `${t} table`, ok: false, detail: (e as Error).message.substring(0, 120) });
    }
  }

  return out;
}

main()
  .catch((e) => {
    console.error("\n❌ Fatal error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
