// Seed color-specific images for existing products.
// Maps each product's colors to real image files from /public/images/.
// Admin can replace these with actual product photos later.
//
// Run with: bun run scripts/seed-color-images.ts
import { db } from "../src/lib/db";

type ColorImg = { colorHex: string; colorName: string; image: string };

const COLOR_IMAGE_MAP: Record<string, ColorImg[]> = {
  "dw-01": [
    { colorHex: "#1a1a1a", colorName: "Black", image: "/images/daily-1.jpg" },
    { colorHex: "#6b5246", colorName: "Mocha", image: "/images/daily-2.jpg" },
    { colorHex: "#d8c7a8", colorName: "Sand", image: "/images/daily-3.jpg" },
  ],
  "dw-02": [
    { colorHex: "#6b5246", colorName: "Mocha", image: "/images/daily-2.jpg" },
    { colorHex: "#1a1a1a", colorName: "Black", image: "/images/daily-1.jpg" },
  ],
  "dw-03": [
    { colorHex: "#d8c7a8", colorName: "Beige", image: "/images/daily-3.jpg" },
    { colorHex: "#e8dcc4", colorName: "Cream", image: "/images/daily-2.jpg" },
    { colorHex: "#1a1a1a", colorName: "Black", image: "/images/daily-1.jpg" },
  ],
  "dw-04": [
    { colorHex: "#3a3633", colorName: "Charcoal", image: "/images/daily-4.jpg" },
    { colorHex: "#1a1a1a", colorName: "Black", image: "/images/daily-1.jpg" },
  ],
  "na-01": [
    { colorHex: "#1a1a1a", colorName: "Black", image: "/images/new-1.jpg" },
    { colorHex: "#c9a24b", colorName: "Gold", image: "/images/best-1.jpg" },
  ],
  "na-02": [
    { colorHex: "#e8dcc4", colorName: "Cream", image: "/images/new-2.jpg" },
    { colorHex: "#d8c7a8", colorName: "Beige", image: "/images/daily-3.jpg" },
  ],
  "bs-01": [
    { colorHex: "#6b5246", colorName: "Mocha", image: "/images/best-1.jpg" },
    { colorHex: "#c9a24b", colorName: "Gold", image: "/images/new-1.jpg" },
  ],
  "bs-02": [
    { colorHex: "#1a1a1a", colorName: "Black", image: "/images/best-2.jpg" },
    { colorHex: "#e8dcc4", colorName: "Cream", image: "/images/daily-2.jpg" },
    { colorHex: "#c9a24b", colorName: "Gold", image: "/images/new-1.jpg" },
  ],
};

async function main() {
  console.log("Seeding color-specific images…");
  const products = await db.product.findMany({ select: { id: true, slug: true } });
  let updated = 0;
  for (const p of products) {
    const colorImgs = COLOR_IMAGE_MAP[p.slug];
    if (!colorImgs) continue;
    await db.product.update({
      where: { id: p.id },
      data: { colorImages: JSON.stringify(colorImgs) },
    });
    console.log(`  ✓ ${p.slug} — ${colorImgs.length} color images`);
    updated++;
  }
  console.log(`Done. Updated ${updated} products.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
