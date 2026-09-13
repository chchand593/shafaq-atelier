// Deactivate all 8 existing products (preserve data, set active=false).
// Then create Product #1: Royal Pleated Abaya — Full Coverage Collection.
//
// This script:
// 1. Sets active=false on all existing products (data preserved, orders safe)
// 2. Ensures "Sage Green" color exists in the Color table
// 3. Creates Product #1 with 5 colors and color-specific images (with gallery)
//
// Run with: bun run scripts/setup-product-1.ts
import { db } from "../src/lib/db";

type ColorOpt = { hex: string; name: string };
type ColorImg = { colorHex: string; colorName: string; image: string; images?: string[] };

async function main() {
  console.log("Step 1: Deactivate all existing products (preserve data)…");
  const result = await db.product.updateMany({
    where: { active: true },
    data: { active: false },
  });
  console.log(`  ✓ Deactivated ${result.count} products (data preserved, orders safe)`);

  console.log("\nStep 2: Ensure 'Sage Green' color exists…");
  const sageGreen = await db.color.upsert({
    where: { name: "Sage Green" },
    update: { hex: "#8a9a7b", active: true },
    create: { name: "Sage Green", hex: "#8a9a7b", active: true, sortOrder: 7 },
  });
  console.log(`  ✓ Sage Green: ${sageGreen.hex}`);

  console.log("\nStep 3: Create Product #1 — Royal Pleated Abaya…");

  // Check if product already exists (idempotent)
  const existing = await db.product.findUnique({ where: { slug: "royal-pleated-abaya" } });
  if (existing) {
    // Update it
    await db.product.update({
      where: { id: existing.id },
      data: {
        name: "Royal Pleated Abaya — Full Coverage Collection",
        category: "Daily Wear",
        price: 12500,
        image: "/images/products/royal-pleated/dusty-rose-1.webp",
        images: JSON.stringify([
          "/images/products/royal-pleated/dusty-rose-1.webp",
          "/images/products/royal-pleated/teal-1.webp",
          "/images/products/royal-pleated/peach-1.webp",
          "/images/products/royal-pleated/charcoal-1.webp",
          "/images/products/royal-pleated/charcoal-2.webp",
          "/images/products/royal-pleated/sage-green-1.webp",
        ]),
        colors: JSON.stringify([
          { hex: "#b87878", name: "Dusty Rose" },
          { hex: "#1a6b6b", name: "Teal" },
          { hex: "#f0c8a8", name: "Peach" },
          { hex: "#3a3633", name: "Charcoal" },
          { hex: "#8a9a7b", name: "Sage Green" },
        ] as ColorOpt[]),
        colorImages: JSON.stringify([
          {
            colorHex: "#b87878",
            colorName: "Dusty Rose",
            image: "/images/products/royal-pleated/dusty-rose-1.webp",
          },
          {
            colorHex: "#1a6b6b",
            colorName: "Teal",
            image: "/images/products/royal-pleated/teal-1.webp",
          },
          {
            colorHex: "#f0c8a8",
            colorName: "Peach",
            image: "/images/products/royal-pleated/peach-1.webp",
          },
          {
            colorHex: "#3a3633",
            colorName: "Charcoal",
            image: "/images/products/royal-pleated/charcoal-1.webp",
            images: ["/images/products/royal-pleated/charcoal-2.webp"],
          },
          {
            colorHex: "#8a9a7b",
            colorName: "Sage Green",
            image: "/images/products/royal-pleated/sage-green-1.webp",
          },
        ] as ColorImg[]),
        fabric: "Premium pleated crepe — flowing, breathable, full coverage.",
        care: "Dry clean recommended. Alternatively hand-wash cold, hang dry in shade.",
        description: "The Royal Pleated Abaya from our Full Coverage Collection. A masterpiece of modest elegance featuring exquisite pleating, balloon sleeves with elasticized cuffs, and a flowing A-line silhouette. Includes a matching hijab for complete coverage. Crafted from premium pleated crepe that drapes beautifully and moves with you.",
        badge: "Full Coverage",
        stock: 25,
        active: true,
      },
    });
    console.log("  ✓ Product #1 updated (already existed)");
  } else {
    // Create new
    await db.product.create({
      data: {
        slug: "royal-pleated-abaya",
        name: "Royal Pleated Abaya — Full Coverage Collection",
        category: "Daily Wear",
        price: 12500,
        image: "/images/products/royal-pleated/dusty-rose-1.webp",
        images: JSON.stringify([
          "/images/products/royal-pleated/dusty-rose-1.webp",
          "/images/products/royal-pleated/teal-1.webp",
          "/images/products/royal-pleated/peach-1.webp",
          "/images/products/royal-pleated/charcoal-1.webp",
          "/images/products/royal-pleated/charcoal-2.webp",
          "/images/products/royal-pleated/sage-green-1.webp",
        ]),
        colors: JSON.stringify([
          { hex: "#b87878", name: "Dusty Rose" },
          { hex: "#1a6b6b", name: "Teal" },
          { hex: "#f0c8a8", name: "Peach" },
          { hex: "#3a3633", name: "Charcoal" },
          { hex: "#8a9a7b", name: "Sage Green" },
        ] as ColorOpt[]),
        colorImages: JSON.stringify([
          {
            colorHex: "#b87878",
            colorName: "Dusty Rose",
            image: "/images/products/royal-pleated/dusty-rose-1.webp",
          },
          {
            colorHex: "#1a6b6b",
            colorName: "Teal",
            image: "/images/products/royal-pleated/teal-1.webp",
          },
          {
            colorHex: "#f0c8a8",
            colorName: "Peach",
            image: "/images/products/royal-pleated/peach-1.webp",
          },
          {
            colorHex: "#3a3633",
            colorName: "Charcoal",
            image: "/images/products/royal-pleated/charcoal-1.webp",
            images: ["/images/products/royal-pleated/charcoal-2.webp"],
          },
          {
            colorHex: "#8a9a7b",
            colorName: "Sage Green",
            image: "/images/products/royal-pleated/sage-green-1.webp",
          },
        ] as ColorImg[]),
        fabric: "Premium pleated crepe — flowing, breathable, full coverage.",
        care: "Dry clean recommended. Alternatively hand-wash cold, hang dry in shade.",
        description: "The Royal Pleated Abaya from our Full Coverage Collection. A masterpiece of modest elegance featuring exquisite pleating, balloon sleeves with elasticized cuffs, and a flowing A-line silhouette. Includes a matching hijab for complete coverage. Crafted from premium pleated crepe that drapes beautifully and moves with you.",
        badge: "Full Coverage",
        stock: 25,
        active: true,
        sizes: JSON.stringify(["XS","S","M","L","XL","XXL"]),
        rating: 5.0,
        reviewCount: 0,
      },
    });
    console.log("  ✓ Product #1 created");
  }

  console.log("\n--- Summary ---");
  console.log("Old products: 8 (all deactivated, data preserved)");
  console.log("New Product #1: Royal Pleated Abaya — Full Coverage Collection");
  console.log("  Colors: Dusty Rose, Teal, Peach, Charcoal (2 images), Sage Green");
  console.log("  Price: PKR 12,500");
  console.log("  Category: Daily Wear");
  console.log("  Active: true (visible to customers)");
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
