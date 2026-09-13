// Create or reset the admin user in the PRODUCTION database.
//
// Usage:
//   export DATABASE_URL="postgresql://user:pass@host/db?schema=public"
//   bun run scripts/create-production-admin.ts
//
// This script:
//   1. Connects to whatever DATABASE_URL is set (production Neon DB)
//   2. Checks if admin@shafaqatelier.pk exists
//   3. If not: creates the admin user
//   4. If yes: resets the password + ensures role is admin
//   5. Prints confirmation
//
// The script is idempotent — safe to run multiple times.

import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@shafaqatelier.pk";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_NAME = "ShafaQ Admin";

async function main() {
  console.log("=== Create / Reset Production Admin User ===\n");
  console.log(`Database URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
  console.log(`Email: ${ADMIN_EMAIL}\n`);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // Check if user exists
  const existing = await db.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    // Update password + ensure admin role
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
    // Create new admin
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

  // Verify
  const verify = await db.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { email: true, role: true, name: true },
  });

  console.log("\n--- Verification ---");
  console.log(`Email: ${verify?.email}`);
  console.log(`Role: ${verify?.role}`);
  console.log(`Name: ${verify?.name}`);
  console.log(`\nLogin credentials:`);
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`\n✅ Done. You can now log in at your production site.`);
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e.message);
    console.error("\nMake sure DATABASE_URL is set to your production Neon PostgreSQL URL.");
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
