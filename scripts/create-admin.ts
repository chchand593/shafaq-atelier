// Create or reset the admin user — works on ANY database (local sandbox, Neon, etc.)
//
// USAGE (Windows PowerShell):
//   cd C:\Users\<username>\Documents\GitHub\shafaq-atelier
//   bun install
//   $env:DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?schema=public"
//   bunx prisma generate
//   bunx prisma db push
//   bun run scripts/create-admin.ts
//
// USAGE (Mac/Linux):
//   cd /path/to/project
//   bun install
//   export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?schema=public"
//   bunx prisma generate
//   bunx prisma db push
//   bun run scripts/create-admin.ts
//
// What it does:
//   1. Connects to whatever DATABASE_URL is set (production Neon DB)
//   2. Checks if admin@shafaqatelier.pk exists
//   3. If not: creates the admin user with bcrypt-hashed password
//   4. If yes: resets the password + ensures role is "admin"
//   5. Prints confirmation with login credentials
//
// The script is idempotent — safe to run multiple times.

import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@shafaqatelier.pk";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_NAME = "ShafaQ Admin";

async function main() {
  console.log("========================================");
  console.log("  Create / Reset Admin User");
  console.log("========================================\n");

  // Show which DB we're connected to (first 40 chars only — no full credentials)
  const dbUrl = process.env.DATABASE_URL || "";
  const safeUrl = dbUrl.substring(0, 40) + (dbUrl.length > 40 ? "..." : "");
  console.log(`Database: ${safeUrl}`);
  console.log(`Email:    ${ADMIN_EMAIL}\n`);

  // Hash the password with bcrypt (same as auth.ts uses)
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // Check if user already exists
  const existing = await db.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    // User exists — update password + ensure admin role
    await db.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        role: "admin",
        name: ADMIN_NAME,
      },
    });
    console.log("✅ Admin user UPDATED (password reset + role confirmed)");
  } else {
    // User does not exist — create new admin
    await db.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        role: "admin",
        passwordHash,
      },
    });
    console.log("✅ Admin user CREATED");
  }

  // Verify by reading back
  const verify = await db.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { email: true, role: true, name: true, createdAt: true },
  });

  console.log("\n----------------------------------------");
  console.log("  Verification");
  console.log("----------------------------------------");
  console.log(`Email:     ${verify?.email}`);
  console.log(`Role:      ${verify?.role}`);
  console.log(`Name:      ${verify?.name}`);
  console.log(`Created:   ${verify?.createdAt}`);
  console.log("----------------------------------------");
  console.log("\n  LOGIN CREDENTIALS:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log("\n✅ Done. You can now log in at your website.\n");
}

main()
  .catch((e) => {
    console.error("\n❌ ERROR:", e.message);
    console.error("\nTroubleshooting:");
    console.error("  1. Make sure DATABASE_URL is set correctly");
    console.error("  2. Make sure 'bunx prisma generate' has been run");
    console.error("  3. Make sure 'bunx prisma db push' has been run (tables exist)");
    console.error("  4. Make sure you can reach your database (network/firewall)");
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
