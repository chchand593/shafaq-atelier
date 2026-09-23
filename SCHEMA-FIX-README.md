# ShafaQ Atelier — Production Schema Fix

This patch fixes the **"columns / tables missing in production"** issue:

```
✅ Database Connection: Connected
✅ User Table: 8 users
✅ Admin: Found
✅ Password Verify: MATCH
✅ Product Table: 7 products
❌ New Arrivals: Column "Product.isNewArrival" does not exist
❌ Best Sellers: Column "Product.isBestSeller" does not exist
❌ Color Table: Table "public.Color" does not exist
❌ Fabric Table: Table "public.Fabric" does not exist
❌ CustomizationOption Table: Table "public.CustomizationOption" does not exist
❌ AbayaStyle Table: Table "public.AbayaStyle" does not exist
```

The schema in `prisma/schema.prisma` is correct — these columns / tables just
never made it onto the production database (no `prisma db push` was ever run
against Neon). This patch ships **three** ways to fix that, all 100% idempotent.

---

## What's new in this patch

| File | Purpose |
|------|---------|
| `src/lib/fix-schema.ts` | Shared idempotent DDL helper (supports PostgreSQL + SQLite). **Splits multi-statement DDL into individual `$executeRawUnsafe` calls** to avoid PostgreSQL 42601 ("cannot insert multiple commands into a prepared statement"). Adds the missing `Product.images` column. Also dedupes admin users. |
| `scripts/fix-missing-columns.ts` | CLI script — run with `bun` against any `DATABASE_URL`. |
| `scripts/fix-missing-columns.sql` | Raw PostgreSQL SQL fallback (Neon SQL Editor / psql). |
| `scripts/delete-duplicate-admin.ts` | CLI script — deletes duplicate admin users, keeps `admin@shafaqatelier.pk`, removes the rest (e.g. legacy `admin@laylamodest.pk`). |
| `src/app/api/admin/fix-schema/route.ts` | Browser-friendly API route (secret-gated). |
| `src/app/api/admin/delete-duplicate-admins/route.ts` | Browser-friendly API route that deletes duplicate admins (keeps `admin@shafaqatelier.pk`). |
| `src/app/api/admin/debug/route.ts` (updated) | Now shows a "🔧 Fix Schema" button when the schema is out of sync, a "🗑️ Delete Duplicate Admins" button when multiple admins exist, and reports `✅ column works` (instead of ❌) for empty New Arrivals / Best Sellers sections. |

---

## Fix option 1 — Browser (easiest, recommended)

1. Make sure `SETUP_SECRET` is set in Vercel → Settings → Environment Variables.
2. Visit in your browser, replacing `YOUR_SETUP_SECRET`:

   ```
   https://shafaq-atelier.vercel.app/api/admin/fix-schema?secret=YOUR_SETUP_SECRET
   ```

3. You will see an HTML report: each step shows ✓ / • / ✗, plus a post-fix
   verification that every column + table is queryable.
4. Click the **"Run Setup Now →"** button (or visit `/api/admin/setup?secret=...`)
   to populate the new tables with 105+ colors, 8 fabrics, 26 customization
   options, and 4 abaya styles with preview images.
5. Re-check `/api/admin/debug` — everything should be ✅.

## Fix option 2 — CLI script (local terminal)

```bash
# 1. Set the production DATABASE_URL (temporarily) in your shell.
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# 2. Run the script from the project root.
bun run scripts/fix-missing-columns.ts
```

The script:
- Detects the provider from the URL prefix (`postgres://` / `postgresql://`).
- Adds the 4 missing Product columns.
- Creates the 5 missing tables with indexes + FKs.
- Prints a per-step report and a post-fix verification.
- Is idempotent — re-runs report "Already exists — skipped" for everything.

## Fix option 3 — Raw SQL (Neon Console / psql)

If neither of the above works (e.g. `SETUP_SECRET` was removed or you can't
run `bun` against the production DB), paste `scripts/fix-missing-columns.sql`
into the **Neon SQL Editor** and run it. Every statement uses `IF NOT EXISTS`
so it's safe to re-run. Two verification queries at the bottom of the file
return the new column / table counts (each should be > 0).

---

## What gets fixed, exactly

### New columns on `Product`

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `isNewArrival` | BOOLEAN | `false` | Flags products to show in the "New Arrivals" storefront section. |
| `isBestSeller` | BOOLEAN | `false` | Flags products to show in the "Best Sellers" storefront section. |
| `isFeatured`   | BOOLEAN | `false` | Flags products to show in the "Daily Wear" / featured section. |
| `images`       | TEXT    | `'[]'`  | JSON array of image URLs (the multiple images gallery; `image` is the primary/first). |
| `colorImages`  | TEXT    | `'[]'`  | JSON array of `{colorHex, colorName, image, images?}` — real photos per color. |

### New tables

| Table | Purpose |
|-------|---------|
| `Color`              | Admin-managed color palette (105+ colors). Used by storefront + Customized Abaya builder. |
| `Fabric`             | Customized Abaya fabrics (8 seeded) with `additionalPrice` and `themeValue`. |
| `CustomizationOption` | Customized Abaya add-ons (26 seeded: sleeves, hijab, embroidery, details, style). |
| `AbayaStyle`         | Customizable abaya silhouettes (4 seeded: Closed Front, Open Front, Kimono, Wrap). |
| `AbayaImage`         | Preview images per AbayaStyle / angle (front / back / left / right / detail). FK to `AbayaStyle` with `ON DELETE CASCADE`. |

---

## After the fix

1. Visit `/api/admin/delete-duplicate-admins?secret=YOUR_SETUP_SECRET` if the debug report shows duplicate admins (e.g. legacy `admin@laylamodest.pk`). This keeps only `admin@shafaqatelier.pk` and deletes the rest.
2. Visit `/api/admin/setup?secret=YOUR_SETUP_SECRET` to seed data into the new tables.
3. Visit `/api/admin/debug` to confirm everything is ✅.
4. Login at `/admin` with `admin@shafaqatelier.pk` / `Admin@123456`.
5. **Security**: Once everything works, remove `SETUP_SECRET` from Vercel to disable the `/api/admin/setup`, `/api/admin/fix-schema`, `/api/admin/delete-duplicate-admins`, and `/api/admin/reset-admin-password` routes.

---

## Order of operations (recommended)

```
1. /api/admin/fix-schema?secret=YOUR_SETUP_SECRET
   → adds Product.images + 4 other columns
   → creates 5 tables (each statement runs separately — no 42601)
   → also dedupes admin users

2. /api/admin/delete-duplicate-admins?secret=YOUR_SETUP_SECRET
   → (only if step 1 reported "Before: 2+, after: 1")
   → belt-and-braces dedupe; keeps admin@shafaqatelier.pk only

3. /api/admin/setup?secret=YOUR_SETUP_SECRET
   → seeds 9 products + 105+ colors + 8 fabrics + 26 options + 4 styles
   → uses upsert (won't create duplicate admins)

4. /api/admin/debug
   → should show "✅ Everything looks good!"
```

---

## Why did this happen?

The production Neon PostgreSQL DB was provisioned early, before
`Product.isNewArrival` / `Color` / `Fabric` / `CustomizationOption` /
`AbayaStyle` / `AbayaImage` were added to `prisma/schema.prisma`. The
build pipeline never ran `prisma db push` against the production
`DATABASE_URL` (which is correct — `db push` should NOT be in the build
script). So the new schema was generated into the Prisma Client but
never landed in the actual database. This patch ships the missing DDL
through three safe, idempotent channels.
