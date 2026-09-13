// Verify database state — check all tables, counts, and admin user.
// Works on any database (local sandbox, Neon production, etc.)
//
// USAGE:
//   $env:DATABASE_URL="postgresql://..."   (Windows PowerShell)
//   export DATABASE_URL="postgresql://..."  (Mac/Linux)
//   bun run scripts/verify-db.ts

import { db } from "../src/lib/db";

async function main() {
  console.log("========================================");
  console.log("  Database Verification");
  console.log("========================================\n");

  const dbUrl = process.env.DATABASE_URL || "";
  const safeUrl = dbUrl.substring(0, 40) + (dbUrl.length > 40 ? "..." : "");
  console.log(`Database: ${safeUrl}\n`);

  // Tables and counts
  const tables = [
    { name: "User", label: "Users" },
    { name: "Product", label: "Products" },
    { name: "Order", label: "Orders" },
    { name: "OrderItem", label: "Order Items" },
    { name: "Review", label: "Reviews" },
    { name: "Color", label: "Colors" },
    { name: "Fabric", label: "Fabrics" },
    { name: "CustomizationOption", label: "Customization Options" },
    { name: "AbayaStyle", label: "Abaya Styles" },
    { name: "AbayaImage", label: "Abaya Images" },
    { name: "StoreSettings", label: "Store Settings" },
    { name: "WishlistItem", label: "Wishlist Items" },
    { name: "GiftCard", label: "Gift Cards" },
    { name: "PointTransaction", label: "Point Transactions" },
  ];

  console.log("--- Table Counts ---");
  let allOk = true;
  for (const t of tables) {
    try {
      const count = await (db as any)[t.name.toLowerCase()].count();
      console.log(`  ${t.label}: ${count}`);
    } catch {
      console.log(`  ${t.label}: TABLE MISSING ❌`);
      allOk = false;
    }
  }

  // Check admin user
  console.log("\n--- Admin User ---");
  const admin = await db.user.findUnique({
    where: { email: "admin@shafaqatelier.pk" },
    select: { email: true, role: true, name: true },
  });

  if (admin) {
    console.log(`  ✅ Found: ${admin.email} (role: ${admin.role}, name: ${admin.name})`);
  } else {
    console.log("  ❌ NOT FOUND — run: bun run scripts/create-admin.ts");
    allOk = false;
  }

  // Check active products
  console.log("\n--- Products ---");
  const total = await db.product.count();
  const active = await db.product.count({ where: { active: true } });
  const na = await db.product.count({ where: { active: true, isNewArrival: true } });
  const bs = await db.product.count({ where: { active: true, isBestSeller: true } });
  const dw = await db.product.count({ where: { active: true, isFeatured: true } });
  console.log(`  Total: ${total}`);
  console.log(`  Active: ${active}`);
  console.log(`  New Arrivals (isNewArrival): ${na}`);
  console.log(`  Best Sellers (isBestSeller): ${bs}`);
  console.log(`  Daily Wear (isFeatured): ${dw}`);

  if (active === 0) {
    console.log("  ⚠ No active products — run: bun run scripts/seed-production.ts");
  }

  // Summary
  console.log("\n========================================");
  if (allOk && admin) {
    console.log("  ✅ Database OK");
  } else {
    console.log("  ⚠ Issues found — see above");
  }
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
