// Map the supplied reference images to the correct products.
//
// VLM ANALYSIS RESULT:
// - Images 1-12 (dusty-rose, teal, peach, charcoal — front + side) all show
//   the SAME abaya design: a plain, closed-front, wrap-style abaya with
//   balloon sleeves and an asymmetrical draped overlay. These are color
//   variants of ONE product = "Noor Everyday Abaya" (dw-01).
// - Images 13-14 (black floral) show a SEPARATE product: a black floral
//   embroidered abaya with bell sleeves. These belong to bs-02 (Yasmin).
//
// This script:
// 1. Updates dw-01 (Noor) colors to include Dusty Rose, Teal, Peach, Charcoal
// 2. Assigns the color-specific images (same product, different colors)
// 3. Updates bs-02 (Yasmin) to use the floral images as gallery images
//
// Run with: bun run scripts/map-color-images.ts
import { db } from "../src/lib/db";

type ColorOpt = { hex: string; name: string };
type ColorImg = { colorHex: string; colorName: string; image: string };

async function main() {
  console.log("Mapping reference images to products…\n");

  // --- dw-01: Noor Everyday Abaya ---
  // Add the new colors (Dusty Rose, Teal, Peach, Charcoal) to the existing
  // Black + Mocha + Sand. Then assign color-specific images for the colors
  // that have real photos. Colors without photos fall back to the main image.
  const noor = await db.product.findUnique({ where: { slug: "dw-01" } });
  if (!noor) { console.log("ERROR: dw-01 not found"); return; }

  const existingColors: ColorOpt[] = JSON.parse(noor.colors);
  const newColors: ColorOpt[] = [
    { hex: "#b87878", name: "Dusty Rose" },
    { hex: "#1a6b6b", name: "Teal" },
    { hex: "#f0c8a8", name: "Peach" },
    { hex: "#3a3633", name: "Charcoal" },
  ];

  // Merge: add new colors that don't already exist (by hex)
  const allColors = [...existingColors];
  for (const nc of newColors) {
    if (!allColors.find((c) => c.hex.toLowerCase() === nc.hex.toLowerCase())) {
      allColors.push(nc);
    }
  }

  // Color-specific images — ALL belong to the SAME Noor Everyday Abaya design.
  // Each color gets its front photo as the primary color image.
  const noorColorImages: ColorImg[] = [
    { colorHex: "#b87878", colorName: "Dusty Rose", image: "/images/products/noor-dusty-rose-front.webp" },
    { colorHex: "#1a6b6b", colorName: "Teal", image: "/images/products/noor-teal-front.webp" },
    { colorHex: "#f0c8a8", colorName: "Peach", image: "/images/products/noor-peach-front.webp" },
    { colorHex: "#3a3633", colorName: "Charcoal", image: "/images/products/noor-charcoal-front.webp" },
  ];

  // Also update the images gallery to include all angles of the default color
  // (the existing daily-1.jpg is Black, so we keep it as primary + add the
  // charcoal angles as additional gallery views since charcoal is the closest
  // to the existing dark image).
  const noorImages = [
    "/images/daily-1.jpg", // existing main image (Black Noor)
    "/images/products/noor-charcoal-front.webp",
    "/images/products/noor-charcoal-side.webp",
    "/images/products/noor-charcoal-front-2.webp",
  ];

  await db.product.update({
    where: { id: noor.id },
    data: {
      colors: JSON.stringify(allColors),
      colorImages: JSON.stringify(noorColorImages),
      images: JSON.stringify(noorImages),
    },
  });
  console.log(`✓ dw-01 (Noor Everyday Abaya) — updated`);
  console.log(`  Colors: ${allColors.map((c) => c.name).join(", ")}`);
  console.log(`  Color images: ${noorColorImages.length} (Dusty Rose, Teal, Peach, Charcoal)`);
  console.log(`  Gallery: ${noorImages.length} images`);

  // --- bs-02: Yasmin Open-Front Abaya ---
  // The black floral images are a separate product/detail set. Use them as
  // gallery images for Yasmin (which is already a black abaya). The floral
  // embroidery is a detail/variant of the same product.
  const yasmin = await db.product.findUnique({ where: { slug: "bs-02" } });
  if (!yasmin) { console.log("ERROR: bs-02 not found"); return; }

  const yasminImages = [
    "/images/best-2.jpg", // existing main image
    "/images/products/yasmin-floral-front.webp",
    "/images/products/yasmin-floral-detail.webp",
  ];

  await db.product.update({
    where: { id: yasmin.id },
    data: {
      images: JSON.stringify(yasminImages),
    },
  });
  console.log(`\n✓ bs-02 (Yasmin Open-Front Abaya) — updated gallery`);
  console.log(`  Gallery: ${yasminImages.length} images (main + floral front + floral detail)`);

  // --- All other products: keep their own main image, no colorImages ---
  // They already have colorImages = "[]" from the previous fix, so no change
  // needed. They will fall back to their own main image for all colors.

  console.log("\n--- Summary ---");
  console.log("dw-01 (Noor): 4 real color photos (Dusty Rose, Teal, Peach, Charcoal) + 3 gallery angles");
  console.log("bs-02 (Yasmin): 2 floral gallery images added");
  console.log("All other products: fall back to their own main image (no cross-product substitution)");
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
