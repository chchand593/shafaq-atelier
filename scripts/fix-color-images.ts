// Clear all incorrect color-image mappings.
//
// PROBLEM: The previous seed script assigned images from OTHER products to
// represent different colors. For example, dw-01 (Noor Everyday Abaya) "Mocha"
// was mapped to /images/daily-2.jpg — which is dw-02 (Sahar Mocha Abaya)'s
// photo. This means clicking "Mocha" on the Noor product showed the Sahar
// design — a completely different abaya.
//
// FIX: Each product only has ONE real photo (its own main image). No separate
// color-specific photos exist in the project. Therefore, ALL colorImages
// mappings are cleared to empty "[]". When a customer selects a color, the
// product falls back to its OWN main image — never another product's image.
//
// The admin can upload real color-specific photos later via:
//   Admin → Products → Manage Color Images
//
// Run with: bun run scripts/fix-color-images.ts
import { db } from "../src/lib/db";

async function main() {
  console.log("Clearing all incorrect color-image mappings…");
  const products = await db.product.findMany({ select: { id: true, slug: true, colorImages: true } });

  let cleared = 0;
  for (const p of products) {
    const current = JSON.parse(p.colorImages || "[]");
    if (current.length > 0) {
      await db.product.update({
        where: { id: p.id },
        data: { colorImages: "[]" },
      });
      console.log(`  ✓ ${p.slug} — cleared ${current.length} incorrect mappings`);
      cleared++;
    }
  }

  console.log(`\nDone. Cleared ${cleared} products.`);
  console.log("\nAll products now fall back to their OWN main image for every color.");
  console.log("Admin can upload real color-specific photos via Admin → Products → Manage Color Images.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
