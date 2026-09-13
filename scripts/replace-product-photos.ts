// Replace old product photos with new supplied reference photos.
//
// CHANGES:
// 1. dw-01 (Noor Everyday Abaya):
//    - Main image: daily-1.jpg → noor-charcoal-front.webp (the closest to the
//      original dark Noor abaya; charcoal is a dark neutral)
//    - Gallery: ALL 12 plain abaya angles (dusty rose, teal, peach, charcoal —
//      front, front-2, side)
//    - ColorImages: each color gets its front photo
//    - Also add a colorImage for Black → noor-charcoal-front.webp (since the
//      original daily-1.jpg is being retired and the new charcoal photo is the
//      same design in a dark color)
//
// 2. bs-02 (Yasmin Open-Front Abaya):
//    - Main image: best-2.jpg → yasmin-floral-front.webp
//    - Gallery: yasmin-floral-front.webp + yasmin-floral-detail.webp
//
// 3. Other products: unchanged (no new photos supplied for them)
//
// 4. AbayaStyle images: update "Closed Front" to use the new Noor photos
//    (same design), and "Open Front" to use the floral photos.
//
// Run with: bun run scripts/replace-product-photos.ts
import { db } from "../src/lib/db";

type ColorOpt = { hex: string; name: string };
type ColorImg = { colorHex: string; colorName: string; image: string };

async function main() {
  console.log("Replacing old product photos with new reference photos…\n");

  // --- 1. dw-01: Noor Everyday Abaya ---
  const noor = await db.product.findUnique({ where: { slug: "dw-01" } });
  if (!noor) { console.log("ERROR: dw-01 not found"); return; }

  // All 12 plain abaya angles — same design, different colors + angles
  const noorGallery = [
    "/images/products/noor-charcoal-front.webp",
    "/images/products/noor-charcoal-front-2.webp",
    "/images/products/noor-charcoal-side.webp",
    "/images/products/noor-dusty-rose-front.webp",
    "/images/products/noor-dusty-rose-front-2.webp",
    "/images/products/noor-dusty-rose-side.webp",
    "/images/products/noor-teal-front.webp",
    "/images/products/noor-teal-front-2.webp",
    "/images/products/noor-teal-side.webp",
    "/images/products/noor-peach-front.webp",
    "/images/products/noor-peach-front-2.webp",
    "/images/products/noor-peach-side.webp",
  ];

  // Color-specific images: each color gets its front photo.
  // Black → charcoal front (charcoal is the closest dark photo we have)
  const noorColorImages: ColorImg[] = [
    { colorHex: "#1a1a1a", colorName: "Black", image: "/images/products/noor-charcoal-front.webp" },
    { colorHex: "#3a3633", colorName: "Charcoal", image: "/images/products/noor-charcoal-front.webp" },
    { colorHex: "#b87878", colorName: "Dusty Rose", image: "/images/products/noor-dusty-rose-front.webp" },
    { colorHex: "#1a6b6b", colorName: "Teal", image: "/images/products/noor-teal-front.webp" },
    { colorHex: "#f0c8a8", colorName: "Peach", image: "/images/products/noor-peach-front.webp" },
  ];
  // Mocha and Sand have no real photo → fallback to main image (no colorImage entry)

  await db.product.update({
    where: { id: noor.id },
    data: {
      image: "/images/products/noor-charcoal-front.webp",
      images: JSON.stringify(noorGallery),
      colorImages: JSON.stringify(noorColorImages),
    },
  });
  console.log("✓ dw-01 (Noor Everyday Abaya) — replaced with new photos");
  console.log(`  main: noor-charcoal-front.webp`);
  console.log(`  gallery: ${noorGallery.length} images (all 12 angles)`);
  console.log(`  colorImages: ${noorColorImages.length} (Black, Charcoal, Dusty Rose, Teal, Peach)`);
  console.log(`  fallback colors: Mocha, Sand → main image`);

  // --- 2. bs-02: Yasmin Open-Front Abaya ---
  const yasmin = await db.product.findUnique({ where: { slug: "bs-02" } });
  if (!yasmin) { console.log("ERROR: bs-02 not found"); return; }

  const yasminGallery = [
    "/images/products/yasmin-floral-front.webp",
    "/images/products/yasmin-floral-detail.webp",
  ];

  await db.product.update({
    where: { id: yasmin.id },
    data: {
      image: "/images/products/yasmin-floral-front.webp",
      images: JSON.stringify(yasminGallery),
    },
  });
  console.log("\n✓ bs-02 (Yasmin Open-Front Abaya) — replaced with floral photos");
  console.log(`  main: yasmin-floral-front.webp`);
  console.log(`  gallery: ${yasminGallery.length} images (floral front + detail)`);

  // --- 3. AbayaStyle images: update to use new photos ---
  // "Closed Front" style → use Noor photos (same plain design)
  const closedFront = await db.abayaStyle.findUnique({ where: { slug: "closed-front" } });
  if (closedFront) {
    await db.abayaImage.deleteMany({ where: { abayaStyleId: closedFront.id } });
    const cfImages = [
      { url: "/images/products/noor-charcoal-front.webp", angle: "front", label: "Front View", isPrimary: true, sortOrder: 0 },
      { url: "/images/products/noor-charcoal-side.webp", angle: "left", label: "Side View", isPrimary: false, sortOrder: 1 },
      { url: "/images/products/noor-dusty-rose-front.webp", angle: "back", label: "Dusty Rose", isPrimary: false, sortOrder: 2 },
      { url: "/images/products/noor-teal-front.webp", angle: "right", label: "Teal", isPrimary: false, sortOrder: 3 },
    ];
    for (const img of cfImages) {
      await db.abayaImage.create({ data: { abayaStyleId: closedFront.id, ...img } });
    }
    console.log("\n✓ AbayaStyle 'Closed Front' — updated with Noor photos");
  }

  // "Open Front" style → use floral photos (separate design)
  const openFront = await db.abayaStyle.findUnique({ where: { slug: "open-front" } });
  if (openFront) {
    await db.abayaImage.deleteMany({ where: { abayaStyleId: openFront.id } });
    const ofImages = [
      { url: "/images/products/yasmin-floral-front.webp", angle: "front", label: "Front View", isPrimary: true, sortOrder: 0 },
      { url: "/images/products/yasmin-floral-detail.webp", angle: "detail", label: "Floral Detail", isPrimary: false, sortOrder: 1 },
    ];
    for (const img of ofImages) {
      await db.abayaImage.create({ data: { abayaStyleId: openFront.id, ...img } });
    }
    console.log("✓ AbayaStyle 'Open Front' — updated with floral photos");
  }

  console.log("\n--- Summary ---");
  console.log("dw-01 (Noor): main + 12 gallery + 5 colorImages → all new reference photos");
  console.log("bs-02 (Yasmin): main + 2 gallery → floral photos");
  console.log("AbayaStyles: Closed Front → Noor photos, Open Front → floral photos");
  console.log("Other products: unchanged");
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
