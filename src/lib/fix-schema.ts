// Idempotent schema fixer for the ShafaQ Atelier production database.
//
// Production issue: the schema in prisma/schema.prisma was extended with
// Product.isNewArrival / Product.isBestSeller / Product.isFeatured /
// Product.images / Product.colorImages columns and brand-new tables Color,
// Fabric, CustomizationOption, AbayaStyle, AbayaImage. The production
// PostgreSQL DB (Neon) did NOT receive these columns/tables (no
// `prisma db push` was run against it), so the storefront's New Arrivals /
// Best Sellers / Customized Abaya builder were all empty.
//
// This module issues raw DDL statements that are 100% idempotent — running
// the function multiple times is safe and never throws on "already exists".
//
// IMPORTANT (PostgreSQL limitation): Prisma's `$executeRawUnsafe` wraps raw
// SQL in a prepared statement, and PostgreSQL prepared statements do NOT
// allow multiple commands in a single call (error code 42601 — "cannot
// insert multiple commands into a prepared statement"). So we split every
// multi-statement DDL block into individual statements and execute each
// one separately.
//
// Supports both providers so we can test in the sandbox (SQLite) and run
// against production (PostgreSQL) using the exact same code path.

import { db } from "./db";

export type FixStep = {
  label: string;
  status: "ok" | "skip" | "fail";
  detail: string;
};

function isPostgres(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  if (isPostgres()) {
    const rows = await db.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM information_schema.columns
      WHERE table_name = ${tableName} AND column_name = ${columnName}
    `;
    return Number(rows[0]?.count ?? 0) > 0;
  }
  // SQLite — PRAGMA does not accept parameters; use $queryRawUnsafe.
  const rows = await db.$queryRawUnsafe<{ name: string }[]>(
    `PRAGMA table_info(${tableName})`
  );
  return rows.some((r) => r.name === columnName);
}

async function tableExists(tableName: string): Promise<boolean> {
  if (isPostgres()) {
    const rows = await db.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM information_schema.tables
      WHERE table_name = ${tableName}
    `;
    return Number(rows[0]?.count ?? 0) > 0;
  }
  // SQLite — sqlite_master name column can't be a bound param reliably.
  const rows = await db.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=${tableNameParam(tableName)}`
  );
  return rows.length > 0;
}

// Helper: SQLite can't interpolate table names as bound parameters in
// sqlite_master queries (some drivers reject it). We escape single quotes.
function tableNameParam(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

async function exec(sql: string): Promise<void> {
  await db.$executeRawUnsafe(sql);
}

// Split a multi-statement SQL block (statements separated by semicolons)
// into individual statements and execute each one separately. PostgreSQL
// prepared statements reject multiple commands in one call (error 42601),
// so we MUST split. We also strip trailing semicolons and skip empty
// statements (e.g. a trailing ";" produces an empty token).
function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    // Re-attach the semicolon — both Postgres and SQLite tolerate it.
    .map((s) => (s.endsWith(";") ? s : s + ";"));
}

async function execMany(statements: string[]): Promise<void> {
  for (const stmt of statements) {
    await exec(stmt);
  }
}

// Main entry — runs every fix step in order, returns a per-step report.
export async function runFixSchema(): Promise<FixStep[]> {
  const steps: FixStep[] = [];
  const pg = isPostgres();

  // --- 1. Product.isNewArrival ---
  steps.push(
    await addColumnStep("Product", "isNewArrival", pg
      ? `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN NOT NULL DEFAULT false;`
      : `ALTER TABLE "Product" ADD COLUMN "isNewArrival" BOOLEAN NOT NULL DEFAULT 0;`
    )
  );

  // --- 2. Product.isBestSeller ---
  steps.push(
    await addColumnStep("Product", "isBestSeller", pg
      ? `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isBestSeller" BOOLEAN NOT NULL DEFAULT false;`
      : `ALTER TABLE "Product" ADD COLUMN "isBestSeller" BOOLEAN NOT NULL DEFAULT 0;`
    )
  );

  // --- 3. Product.isFeatured ---
  steps.push(
    await addColumnStep("Product", "isFeatured", pg
      ? `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;`
      : `ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT 0;`
    )
  );

  // --- 4. Product.images (JSON array of image URLs — was missing on prod) ---
  steps.push(
    await addColumnStep("Product", "images", pg
      ? `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "images" TEXT NOT NULL DEFAULT '[]';`
      : `ALTER TABLE "Product" ADD COLUMN "images" TEXT NOT NULL DEFAULT '[]';`
    )
  );

  // --- 5. Product.colorImages (JSON array of {colorHex,colorName,image}) ---
  steps.push(
    await addColumnStep("Product", "colorImages", pg
      ? `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "colorImages" TEXT NOT NULL DEFAULT '[]';`
      : `ALTER TABLE "Product" ADD COLUMN "colorImages" TEXT NOT NULL DEFAULT '[]';`
    )
  );

  // --- 5b. Product.lowStockThreshold (was missing from original schema repair) ---
  steps.push(
    await addColumnStep("Product", "lowStockThreshold", pg
      ? `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;`
      : `ALTER TABLE "Product" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;`
    )
  );

  // --- 6. Color table (statements split — Postgres prepared-statement fix) ---
  steps.push(await createTableStep("Color", pg
    ? [
        `CREATE TABLE IF NOT EXISTS "Color" (
            "id"        TEXT NOT NULL,
            "name"      TEXT NOT NULL,
            "hex"       TEXT NOT NULL,
            "active"    BOOLEAN NOT NULL DEFAULT true,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
          )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "Color_name_key" ON "Color"("name")`,
      ]
    : [
        `CREATE TABLE IF NOT EXISTS "Color" (
            "id"        TEXT NOT NULL PRIMARY KEY,
            "name"      TEXT NOT NULL UNIQUE,
            "hex"       TEXT NOT NULL,
            "active"    BOOLEAN NOT NULL DEFAULT 1,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`,
      ]
  ));

  // --- 7. Fabric table ---
  steps.push(await createTableStep("Fabric", pg
    ? [
        `CREATE TABLE IF NOT EXISTS "Fabric" (
            "id"              TEXT NOT NULL,
            "name"            TEXT NOT NULL,
            "description"     TEXT NOT NULL DEFAULT '',
            "additionalPrice" INTEGER NOT NULL DEFAULT 0,
            "themeValue"      TEXT NOT NULL DEFAULT '',
            "active"          BOOLEAN NOT NULL DEFAULT true,
            "sortOrder"       INTEGER NOT NULL DEFAULT 0,
            "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"       TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Fabric_pkey" PRIMARY KEY ("id")
          )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "Fabric_name_key" ON "Fabric"("name")`,
      ]
    : [
        `CREATE TABLE IF NOT EXISTS "Fabric" (
            "id"              TEXT NOT NULL PRIMARY KEY,
            "name"            TEXT NOT NULL UNIQUE,
            "description"     TEXT NOT NULL DEFAULT '',
            "additionalPrice" INTEGER NOT NULL DEFAULT 0,
            "themeValue"      TEXT NOT NULL DEFAULT '',
            "active"          BOOLEAN NOT NULL DEFAULT 1,
            "sortOrder"       INTEGER NOT NULL DEFAULT 0,
            "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`,
      ]
  ));

  // --- 8. CustomizationOption table ---
  steps.push(await createTableStep("CustomizationOption", pg
    ? [
        `CREATE TABLE IF NOT EXISTS "CustomizationOption" (
            "id"              TEXT NOT NULL,
            "name"            TEXT NOT NULL,
            "description"     TEXT NOT NULL DEFAULT '',
            "optionType"      TEXT NOT NULL DEFAULT 'addon',
            "additionalPrice" INTEGER NOT NULL DEFAULT 0,
            "active"          BOOLEAN NOT NULL DEFAULT true,
            "sortOrder"       INTEGER NOT NULL DEFAULT 0,
            "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"       TIMESTAMP(3) NOT NULL,
            CONSTRAINT "CustomizationOption_pkey" PRIMARY KEY ("id")
          )`,
        `CREATE INDEX IF NOT EXISTS "CustomizationOption_optionType_idx" ON "CustomizationOption"("optionType")`,
      ]
    : [
        `CREATE TABLE IF NOT EXISTS "CustomizationOption" (
            "id"              TEXT NOT NULL PRIMARY KEY,
            "name"            TEXT NOT NULL,
            "description"     TEXT NOT NULL DEFAULT '',
            "optionType"      TEXT NOT NULL DEFAULT 'addon',
            "additionalPrice" INTEGER NOT NULL DEFAULT 0,
            "active"          BOOLEAN NOT NULL DEFAULT 1,
            "sortOrder"       INTEGER NOT NULL DEFAULT 0,
            "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`,
        `CREATE INDEX IF NOT EXISTS "CustomizationOption_optionType_idx" ON "CustomizationOption"("optionType")`,
      ]
  ));

  // --- 9. AbayaStyle table ---
  steps.push(await createTableStep("AbayaStyle", pg
    ? [
        `CREATE TABLE IF NOT EXISTS "AbayaStyle" (
            "id"          TEXT NOT NULL,
            "name"        TEXT NOT NULL,
            "slug"        TEXT NOT NULL,
            "description" TEXT NOT NULL DEFAULT '',
            "active"      BOOLEAN NOT NULL DEFAULT true,
            "sortOrder"   INTEGER NOT NULL DEFAULT 0,
            "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"   TIMESTAMP(3) NOT NULL,
            CONSTRAINT "AbayaStyle_pkey" PRIMARY KEY ("id")
          )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "AbayaStyle_name_key" ON "AbayaStyle"("name")`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "AbayaStyle_slug_key" ON "AbayaStyle"("slug")`,
      ]
    : [
        `CREATE TABLE IF NOT EXISTS "AbayaStyle" (
            "id"          TEXT NOT NULL PRIMARY KEY,
            "name"        TEXT NOT NULL UNIQUE,
            "slug"        TEXT NOT NULL UNIQUE,
            "description" TEXT NOT NULL DEFAULT '',
            "active"      BOOLEAN NOT NULL DEFAULT 1,
            "sortOrder"   INTEGER NOT NULL DEFAULT 0,
            "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`,
      ]
  ));

  // --- 10. AbayaImage table (FK to AbayaStyle — must run AFTER AbayaStyle) ---
  steps.push(await createTableStep("AbayaImage", pg
    ? [
        `CREATE TABLE IF NOT EXISTS "AbayaImage" (
            "id"           TEXT NOT NULL,
            "abayaStyleId" TEXT NOT NULL,
            "url"          TEXT NOT NULL,
            "angle"        TEXT NOT NULL DEFAULT 'front',
            "label"        TEXT NOT NULL DEFAULT '',
            "isPrimary"    BOOLEAN NOT NULL DEFAULT false,
            "colorHex"     TEXT,
            "sortOrder"    INTEGER NOT NULL DEFAULT 0,
            "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"   TIMESTAMP(3) NOT NULL,
            CONSTRAINT "AbayaImage_pkey" PRIMARY KEY ("id")
          )`,
        `CREATE INDEX IF NOT EXISTS "AbayaImage_abayaStyleId_idx" ON "AbayaImage"("abayaStyleId")`,
        `CREATE INDEX IF NOT EXISTS "AbayaImage_colorHex_idx" ON "AbayaImage"("colorHex")`,
        `ALTER TABLE "AbayaImage" DROP CONSTRAINT IF EXISTS "AbayaImage_abayaStyleId_fkey"`,
        `ALTER TABLE "AbayaImage" ADD CONSTRAINT "AbayaImage_abayaStyleId_fkey"
            FOREIGN KEY ("abayaStyleId") REFERENCES "AbayaStyle"("id") ON DELETE CASCADE`,
      ]
    : [
        `CREATE TABLE IF NOT EXISTS "AbayaImage" (
            "id"           TEXT NOT NULL PRIMARY KEY,
            "abayaStyleId" TEXT NOT NULL,
            "url"          TEXT NOT NULL,
            "angle"        TEXT NOT NULL DEFAULT 'front',
            "label"        TEXT NOT NULL DEFAULT '',
            "isPrimary"    BOOLEAN NOT NULL DEFAULT 0,
            "colorHex"     TEXT,
            "sortOrder"    INTEGER NOT NULL DEFAULT 0,
            "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("abayaStyleId") REFERENCES "AbayaStyle"("id") ON DELETE CASCADE
          )`,
        `CREATE INDEX IF NOT EXISTS "AbayaImage_abayaStyleId_idx" ON "AbayaImage"("abayaStyleId")`,
        `CREATE INDEX IF NOT EXISTS "AbayaImage_colorHex_idx" ON "AbayaImage"("colorHex")`,
      ]
  ));

  // --- 11. NewsletterSubscriber table (idempotent) ---
  steps.push(await createTableStep("NewsletterSubscriber", pg
    ? [
        `CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
            "id"        TEXT NOT NULL,
            "email"      TEXT NOT NULL,
            "name"       TEXT,
            "active"     BOOLEAN NOT NULL DEFAULT true,
            "source"     TEXT NOT NULL DEFAULT 'homepage',
            "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"  TIMESTAMP(3) NOT NULL,
            CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
          )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email")`,
        `CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_active_idx" ON "NewsletterSubscriber"("active")`,
      ]
    : [
        `CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
            "id"        TEXT NOT NULL PRIMARY KEY,
            "email"      TEXT NOT NULL UNIQUE,
            "name"       TEXT,
            "active"     BOOLEAN NOT NULL DEFAULT 1,
            "source"     TEXT NOT NULL DEFAULT 'homepage',
            "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`,
        `CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_active_idx" ON "NewsletterSubscriber"("active")`,
      ]
  ));

  // --- 12. OrderItem.customization column (JSON for custom abaya details) ---
  steps.push(
    await addColumnStep("OrderItem", "customization", pg
      ? `ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "customization" TEXT;`
      : `ALTER TABLE "OrderItem" ADD COLUMN "customization" TEXT;`
    )
  );

  // --- 13. Review.approved + Review.featured columns ---
  steps.push(
    await addColumnStep("Review", "approved", pg
      ? `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "approved" BOOLEAN NOT NULL DEFAULT true;`
      : `ALTER TABLE "Review" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT 1;`
    )
  );
  steps.push(
    await addColumnStep("Review", "featured", pg
      ? `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;`
      : `ALTER TABLE "Review" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT 0;`
    )
  );
  // Add index for the new approved column (Postgres only; SQLite auto-indexes)
  if (pg) {
    try {
      await exec(`CREATE INDEX IF NOT EXISTS "Review_approved_idx" ON "Review"("approved");`);
    } catch { /* ignore */ }
  }

  // --- 14. Admin user REPORT (non-destructive) ---
  // Reports the number of admin users. Does NOT delete any users.
  // If duplicate admins are detected, they are reported in the step detail
  // so the site owner can manually remove them if desired.
  steps.push(await reportAdminUsers());

  return steps;
}

async function addColumnStep(
  table: string,
  column: string,
  sqlIfMissing: string
): Promise<FixStep> {
  try {
    const exists = await columnExists(table, column);
    if (exists) {
      return { label: `${table}.${column}`, status: "skip", detail: "Already exists — skipped" };
    }
    await exec(sqlIfMissing);
    return { label: `${table}.${column}`, status: "ok", detail: "Column added" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    // Idempotency fallback: if the error is "duplicate column", treat as skip.
    if (/already exists|duplicate column/i.test(msg)) {
      return { label: `${table}.${column}`, status: "skip", detail: "Already exists — skipped" };
    }
    return { label: `${table}.${column}`, status: "fail", detail: msg.substring(0, 200) };
  }
}

// `statements` is an array of individual SQL statements. Each one is
// executed separately via $executeRawUnsafe to avoid PostgreSQL's
// "cannot insert multiple commands into a prepared statement" error.
async function createTableStep(table: string, statements: string[]): Promise<FixStep> {
  try {
    const exists = await tableExists(table);
    // Always run all statements — CREATE TABLE IF NOT EXISTS + CREATE INDEX
    // IF NOT EXISTS are idempotent so re-running on existing tables is safe
    // and ensures indexes/constraints are present even on a half-created table.
    await execMany(statements);
    if (exists) {
      return { label: `${table} table`, status: "skip", detail: "Already existed — indexes verified" };
    }
    return { label: `${table} table`, status: "ok", detail: `Created (${statements.length} statements executed)` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (/already exists/i.test(msg)) {
      return { label: `${table} table`, status: "skip", detail: "Already exists — skipped" };
    }
    return { label: `${table} table`, status: "fail", detail: msg.substring(0, 200) };
  }
}

// NON-DESTRUCTIVE: Report admin users. Does NOT delete any users.
// If duplicate admins are detected, they are reported in the detail so
// the site owner can manually remove them via the admin panel or Neon
// SQL Editor. This function never calls db.user.delete() or deleteMany().
async function reportAdminUsers(): Promise<FixStep> {
  try {
    const admins = await db.user.findMany({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (admins.length === 0) {
      return {
        label: "Admin users (report)",
        status: "fail",
        detail: "No admin users found. Run /api/admin/setup?secret=... to create one.",
      };
    }

    if (admins.length === 1) {
      return {
        label: "Admin users (report)",
        status: "ok",
        detail: `1 admin: ${admins[0].email} — no duplicates detected.`,
      };
    }

    // Multiple admins — report but do NOT delete
    const adminList = admins.map((a) => `${a.email} (${a.name})`).join(", ");
    return {
      label: "Admin users (report)",
      status: "ok",
      detail: `${admins.length} admin(s) detected: ${adminList}. Multiple admins found — the canonical is admin@shafaqatelier.pk. No users were deleted. To remove duplicates, use the admin panel or Neon SQL Editor manually.`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { label: "Admin users (report)", status: "fail", detail: msg.substring(0, 200) };
  }
}
