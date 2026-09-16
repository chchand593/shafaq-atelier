// Idempotent schema fixer for the ShafaQ Atelier production database.
//
// Production issue: the schema in prisma/schema.prisma was extended with
// Product.isNewArrival / Product.isBestSeller / Product.isFeatured /
// Product.colorImages columns and brand-new tables Color, Fabric,
// CustomizationOption, AbayaStyle, AbayaImage. The production PostgreSQL DB
// (Neon) did NOT receive these columns/tables (no `prisma db push` was run
// against it), so the storefront's New Arrivals / Best Sellers / Customized
// Abaya builder were all empty.
//
// This module issues raw DDL statements that are 100% idempotent — running
// the function multiple times is safe and never throws on "already exists".
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

// PostgreSQL uses quoted, case-sensitive identifiers (e.g. "Product").
// SQLite is case-insensitive and doesn't need quotes (quotes are tolerated
// but PRAGMA table_info("Product") is fine).
function q(name: string): string {
  return isPostgres() ? `"${name}"` : name;
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

  // --- 4. Product.colorImages (JSON string, default '[]') ---
  steps.push(
    await addColumnStep("Product", "colorImages", pg
      ? `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "colorImages" TEXT NOT NULL DEFAULT '[]';`
      : `ALTER TABLE "Product" ADD COLUMN "colorImages" TEXT NOT NULL DEFAULT '[]';`
    )
  );

  // --- 5. Color table ---
  steps.push(await createTableStep("Color", pg
    ? `CREATE TABLE IF NOT EXISTS "Color" (
        "id"        TEXT NOT NULL,
        "name"      TEXT NOT NULL,
        "hex"       TEXT NOT NULL,
        "active"    BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Color_name_key" ON "Color"("name");`
    : `CREATE TABLE IF NOT EXISTS "Color" (
        "id"        TEXT NOT NULL PRIMARY KEY,
        "name"      TEXT NOT NULL UNIQUE,
        "hex"       TEXT NOT NULL,
        "active"    BOOLEAN NOT NULL DEFAULT 1,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
  ));

  // --- 6. Fabric table ---
  steps.push(await createTableStep("Fabric", pg
    ? `CREATE TABLE IF NOT EXISTS "Fabric" (
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
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Fabric_name_key" ON "Fabric"("name");`
    : `CREATE TABLE IF NOT EXISTS "Fabric" (
        "id"              TEXT NOT NULL PRIMARY KEY,
        "name"            TEXT NOT NULL UNIQUE,
        "description"     TEXT NOT NULL DEFAULT '',
        "additionalPrice" INTEGER NOT NULL DEFAULT 0,
        "themeValue"      TEXT NOT NULL DEFAULT '',
        "active"          BOOLEAN NOT NULL DEFAULT 1,
        "sortOrder"       INTEGER NOT NULL DEFAULT 0,
        "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
  ));

  // --- 7. CustomizationOption table ---
  steps.push(await createTableStep("CustomizationOption", pg
    ? `CREATE TABLE IF NOT EXISTS "CustomizationOption" (
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
      );
      CREATE INDEX IF NOT EXISTS "CustomizationOption_optionType_idx" ON "CustomizationOption"("optionType");`
    : `CREATE TABLE IF NOT EXISTS "CustomizationOption" (
        "id"              TEXT NOT NULL PRIMARY KEY,
        "name"            TEXT NOT NULL,
        "description"     TEXT NOT NULL DEFAULT '',
        "optionType"      TEXT NOT NULL DEFAULT 'addon',
        "additionalPrice" INTEGER NOT NULL DEFAULT 0,
        "active"          BOOLEAN NOT NULL DEFAULT 1,
        "sortOrder"       INTEGER NOT NULL DEFAULT 0,
        "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "CustomizationOption_optionType_idx" ON "CustomizationOption"("optionType");`
  ));

  // --- 8. AbayaStyle table ---
  steps.push(await createTableStep("AbayaStyle", pg
    ? `CREATE TABLE IF NOT EXISTS "AbayaStyle" (
        "id"          TEXT NOT NULL,
        "name"        TEXT NOT NULL,
        "slug"        TEXT NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "active"      BOOLEAN NOT NULL DEFAULT true,
        "sortOrder"   INTEGER NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL,
        CONSTRAINT "AbayaStyle_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "AbayaStyle_name_key" ON "AbayaStyle"("name");
      CREATE UNIQUE INDEX IF NOT EXISTS "AbayaStyle_slug_key" ON "AbayaStyle"("slug");`
    : `CREATE TABLE IF NOT EXISTS "AbayaStyle" (
        "id"          TEXT NOT NULL PRIMARY KEY,
        "name"        TEXT NOT NULL UNIQUE,
        "slug"        TEXT NOT NULL UNIQUE,
        "description" TEXT NOT NULL DEFAULT '',
        "active"      BOOLEAN NOT NULL DEFAULT 1,
        "sortOrder"   INTEGER NOT NULL DEFAULT 0,
        "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
  ));

  // --- 9. AbayaImage table ---
  steps.push(await createTableStep("AbayaImage", pg
    ? `CREATE TABLE IF NOT EXISTS "AbayaImage" (
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
      );
      CREATE INDEX IF NOT EXISTS "AbayaImage_abayaStyleId_idx" ON "AbayaImage"("abayaStyleId");
      CREATE INDEX IF NOT EXISTS "AbayaImage_colorHex_idx" ON "AbayaImage"("colorHex");
      ALTER TABLE "AbayaImage" DROP CONSTRAINT IF EXISTS "AbayaImage_abayaStyleId_fkey";
      ALTER TABLE "AbayaImage" ADD CONSTRAINT "AbayaImage_abayaStyleId_fkey"
        FOREIGN KEY ("abayaStyleId") REFERENCES "AbayaStyle"("id") ON DELETE CASCADE;`
    : `CREATE TABLE IF NOT EXISTS "AbayaImage" (
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
      );
      CREATE INDEX IF NOT EXISTS "AbayaImage_abayaStyleId_idx" ON "AbayaImage"("abayaStyleId");
      CREATE INDEX IF NOT EXISTS "AbayaImage_colorHex_idx" ON "AbayaImage"("colorHex");`
  ));

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

async function createTableStep(table: string, sql: string): Promise<FixStep> {
  try {
    const exists = await tableExists(table);
    if (exists) {
      // Still run CREATE TABLE IF NOT EXISTS to ensure indexes/constraints exist.
      await exec(sql);
      return { label: `${table} table`, status: "skip", detail: "Already existed — verified (indexes checked)" };
    }
    await exec(sql);
    return { label: `${table} table`, status: "ok", detail: "Created with indexes + constraints" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (/already exists/i.test(msg)) {
      return { label: `${table} table`, status: "skip", detail: "Already exists — skipped" };
    }
    return { label: `${table} table`, status: "fail", detail: msg.substring(0, 200) };
  }
}
