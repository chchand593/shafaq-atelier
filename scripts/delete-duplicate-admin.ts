// Delete duplicate admin users from the production database.
//
// Usage:
//   export DATABASE_URL="postgresql://user:pass@host/db?schema=public"
//   bun run scripts/delete-duplicate-admin.ts
//
// What this script does:
//   1. Lists all users with role='admin'.
//   2. Keeps the canonical admin (admin@shafaqatelier.pk) — or, if not present,
//      keeps the oldest admin by createdAt.
//   3. Deletes every other admin (including the wrong
//      admin@laylamodest.pk from the old setup).
//   4. Reports exactly which admins were kept + deleted.
//
// Idempotent — safe to run multiple times. If only one admin remains, the
// script reports "no dedupe needed" and exits.

import { db } from "../src/lib/db";

const CANONICAL_EMAIL = "admin@shafaqatelier.pk";

async function main() {
  console.log("=== Delete Duplicate Admin Users ===\n");
  console.log(`Database: ${(process.env.DATABASE_URL || "").substring(0, 40)}${(process.env.DATABASE_URL || "").length > 40 ? "..." : ""}`);
  console.log(`Canonical admin (kept): ${CANONICAL_EMAIL}\n`);

  const admins = await db.user.findMany({
    where: { role: "admin" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  console.log(`Found ${admins.length} admin(s):\n`);
  for (const a of admins) {
    console.log(`  - ${a.email}  (${a.name})  created ${a.createdAt.toISOString()}`);
  }
  console.log("");

  if (admins.length <= 1) {
    console.log("✅ Only 1 (or 0) admin(s) — no dedupe needed. Exiting.");
    return;
  }

  // Pick the canonical admin
  const canonical = admins.find((a) => a.email.toLowerCase() === CANONICAL_EMAIL) ?? admins[0];
  console.log(`Canonical admin: ${canonical.email}\n`);

  // Every other admin is a duplicate → delete it
  const duplicates = admins.filter((a) => a.id !== canonical.id);
  let deleted = 0;
  const deletedEmails: string[] = [];

  for (const dup of duplicates) {
    try {
      await db.user.delete({ where: { id: dup.id } });
      deleted++;
      deletedEmails.push(dup.email);
      console.log(`  ❌ Deleted: ${dup.email}`);
    } catch (e) {
      console.log(`  ⚠️  Could not delete ${dup.email}: ${(e as Error).message.substring(0, 100)}`);
    }
  }

  console.log("");
  console.log(`✅ Dedupe complete.`);
  console.log(`   Kept: ${canonical.email}`);
  console.log(`   Deleted: ${deleted} duplicate(s): ${deletedEmails.join(", ") || "—"}`);

  // Verify final state
  const remaining = await db.user.findMany({
    where: { role: "admin" },
    select: { email: true, name: true },
  });
  console.log(`\nFinal admin users (${remaining.length}):`);
  for (const a of remaining) {
    console.log(`  ✅ ${a.email}  (${a.name})`);
  }
}

main()
  .catch((e) => {
    console.error("\n❌ Fatal error:", e.message);
    console.error("Make sure DATABASE_URL is set to your production Neon PostgreSQL URL.");
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
