-- ============================================================================
-- ShafaQ Atelier — Production Schema Fix (raw SQL, PostgreSQL only)
-- ============================================================================
--
-- Run this against your production Neon PostgreSQL database if you cannot
-- use /api/admin/fix-schema or scripts/fix-missing-columns.ts.
--
-- HOW TO RUN:
--   1. Open the Neon Console → your project → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--
--   Or via psql:
--     psql "postgresql://user:pass@host/db?sslmode=require" -f scripts/fix-missing-columns.sql
--
-- This script is 100% IDEMPOTENT — every statement uses IF NOT EXISTS so it
-- can be re-run any number of times without error. Already-present columns /
-- tables / indexes / constraints are silently skipped.
--
-- After running this, hit /api/admin/setup?secret=YOUR_SETUP_SECRET in the
-- browser to populate the new tables with seed data (105+ colors, 8 fabrics,
-- 26 customization options, 4 abaya styles with preview images).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add missing columns to "Product"
-- ---------------------------------------------------------------------------

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isBestSeller" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "images"       TEXT    NOT NULL DEFAULT '[]';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "colorImages"  TEXT    NOT NULL DEFAULT '[]';

-- ---------------------------------------------------------------------------
-- 2. Create "Color" table (admin-managed color palette, 100+ colors)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Color" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "hex"       TEXT NOT NULL,
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Color_name_key" ON "Color"("name");

-- ---------------------------------------------------------------------------
-- 3. Create "Fabric" table (Customized Abaya builder fabrics)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Fabric" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "Fabric_name_key" ON "Fabric"("name");

-- ---------------------------------------------------------------------------
-- 4. Create "CustomizationOption" table (sleeves / hijab / embroidery / details)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "CustomizationOption" (
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

CREATE INDEX IF NOT EXISTS "CustomizationOption_optionType_idx"
    ON "CustomizationOption"("optionType");

-- ---------------------------------------------------------------------------
-- 5. Create "AbayaStyle" table (customizable abaya silhouettes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AbayaStyle" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "AbayaStyle_slug_key" ON "AbayaStyle"("slug");

-- ---------------------------------------------------------------------------
-- 6. Create "AbayaImage" table (preview images per AbayaStyle, per angle)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AbayaImage" (
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
CREATE INDEX IF NOT EXISTS "AbayaImage_colorHex_idx"     ON "AbayaImage"("colorHex");

-- Add the foreign key constraint (drop first if it already exists to remain idempotent).
ALTER TABLE "AbayaImage" DROP CONSTRAINT IF EXISTS "AbayaImage_abayaStyleId_fkey";
ALTER TABLE "AbayaImage" ADD CONSTRAINT "AbayaImage_abayaStyleId_fkey"
    FOREIGN KEY ("abayaStyleId") REFERENCES "AbayaStyle"("id") ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 7. Create "NewsletterSubscriber" table (newsletter signups)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "name"      TEXT,
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "source"    TEXT NOT NULL DEFAULT 'homepage',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_active_idx" ON "NewsletterSubscriber"("active");

-- ---------------------------------------------------------------------------
-- 8. Add OrderItem.customization column (JSON for custom abaya details)
-- ---------------------------------------------------------------------------
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "customization" TEXT;

-- ---------------------------------------------------------------------------
-- 9. Add Review.approved + Review.featured columns (moderation gate)
-- ---------------------------------------------------------------------------
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "approved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "Review_approved_idx" ON "Review"("approved");

COMMIT;

-- ============================================================================
-- Verification queries — run these after COMMIT to confirm everything landed.
-- All four queries should return > 0.
-- ============================================================================

-- Missing Product columns now present?
SELECT
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'isNewArrival') AS has_isNewArrival,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'isBestSeller') AS has_isBestSeller,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'isFeatured')   AS has_isFeatured,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'images')       AS has_images,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'colorImages')  AS has_colorImages;

-- New OrderItem + Review columns now present?
SELECT
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'OrderItem' AND column_name = 'customization') AS has_OrderItem_customization,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'approved') AS has_Review_approved,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'featured') AS has_Review_featured;

-- Missing tables now present?
SELECT
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'Color')                AS has_Color,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'Fabric')               AS has_Fabric,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'CustomizationOption')  AS has_CustomizationOption,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'AbayaStyle')           AS has_AbayaStyle,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'AbayaImage')           AS has_AbayaImage,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'NewsletterSubscriber') AS has_NewsletterSubscriber;
