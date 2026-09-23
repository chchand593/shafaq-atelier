# ShafaQ Atelier — Production Setup Guide

This guide explains how to set up the production database, create the admin user, and verify everything works.

## Prerequisites

- Node.js or Bun installed on your machine
- A Neon PostgreSQL database (or any PostgreSQL provider)
- The project code (from `shafaq-final.zip`)

## Step 1: Install Dependencies

```bash
cd /path/to/your/project
bun install
```

## Step 2: Set Production Database URL

Get your Neon PostgreSQL connection string from Vercel → Settings → Environment Variables → `DATABASE_URL`.

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?schema=public"
```

**Mac/Linux:**
```bash
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?schema=public"
```

## Step 3: Generate Prisma Client + Push Schema

```bash
bunx prisma generate
bunx prisma db push
```

This creates all tables in your production database (safe — won't delete existing data).

## Step 4: Create Admin User

```bash
bun run scripts/create-admin.ts
```

**Output:**
```
✅ Admin user CREATED

LOGIN CREDENTIALS:
  Email:    admin@shafaqatelier.pk
  Password: Admin@123456
```

## Step 5: Seed Products (If Database Is Empty)

```bash
bun run scripts/seed-production.ts
```

This creates:
- 9 products (8 original + 1 Royal Pleated Abaya)
- 105+ colors
- 8 fabrics
- 26 customization options
- 4 abaya styles with images
- Admin user

## Step 6: Verify Database

```bash
bun run scripts/verify-db.ts
```

This checks all tables, counts, admin user, and product flags.

## Step 7: Deploy to Vercel

1. Push code to GitHub
2. Vercel auto-deploys
3. Set these Environment Variables in Vercel:
   - `DATABASE_URL` — your Neon PostgreSQL URL
   - `NEXTAUTH_URL` — your production URL (e.g. `https://shafaqatelier.pk`)
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate
   - `BLOB_READ_WRITE_TOKEN` — from Vercel → Storage → Blob store

## Environment Variables Reference

| Variable | Where to get it | Required |
|----------|----------------|----------|
| `DATABASE_URL` | Neon PostgreSQL dashboard | ✅ Yes |
| `NEXTAUTH_URL` | Your production domain | ✅ Yes |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | ✅ Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob | For image uploads |

## Admin Login

- **Email:** `admin@shafaqatelier.pk`
- **Password:** `Admin@123456`

## Quick Commands

| Command | What it does |
|---------|-------------|
| `bun run scripts/create-admin.ts` | Create/reset admin user |
| `bun run scripts/seed-production.ts` | Seed full production DB |
| `bun run scripts/verify-db.ts` | Verify DB state |
| `bun run scripts/fix-missing-columns.ts` | Add missing Product columns + create Color/Fabric/CustomizationOption/AbayaStyle/AbayaImage tables (idempotent) |
| `bun run scripts/delete-duplicate-admin.ts` | Delete duplicate admin users — keeps `admin@shafaqatelier.pk`, removes the rest (e.g. `admin@laylamodest.pk`) |
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run lint` | ESLint check |

## Browser Routes (Vercel — no terminal needed)

All routes are protected by `SETUP_SECRET` env var (replace `YOUR_SETUP_SECRET` with your actual secret):

| URL | Purpose |
|-----|---------|
| `/api/admin/fix-schema?secret=YOUR_SETUP_SECRET` | Add missing Product columns + create the 5 new tables. Idempotent. Also dedupes admin users. |
| `/api/admin/setup?secret=YOUR_SETUP_SECRET` | Seed 9 products + 105+ colors + 8 fabrics + 26 options + 4 styles. Creates admin user via `upsert` (no duplicates). |
| `/api/admin/delete-duplicate-admins?secret=YOUR_SETUP_SECRET` | Delete duplicate admin users — keeps `admin@shafaqatelier.pk`, deletes the rest. Useful for removing legacy `admin@laylamodest.pk`. |
| `/api/admin/reset-admin-password?secret=YOUR_SETUP_SECRET` | Forcibly reset admin password to `Admin@123456`. |
| `/api/admin/debug` | Diagnostic report — DB connection, tables, admin user, password verification, env vars. **No secret required.** |

## Troubleshooting

### "Invalid email or password" on login
- Run `bun run scripts/create-admin.ts` with production `DATABASE_URL` set
- This will create or reset the admin user

### "db.abayaStyle not found" build error
- `package.json` has `"postinstall": "prisma generate"` — this runs automatically on Vercel
- If building locally, run `bunx prisma generate` before `bun run build`

### Empty homepage (no products)
- Run `bun run scripts/seed-production.ts` with production `DATABASE_URL` set
- Or check that products have `active: true` in the database
