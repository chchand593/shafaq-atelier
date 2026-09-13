// Seed AbayaStyle + AbayaImage data.
// Creates abaya styles from the existing customization options (style group)
// and assigns multiple preview images to each style using the existing
// /images/*.jpg assets. Admin can manage these later without code changes.
//
// Run with: bun run scripts/seed-abaya-styles.ts
import { db } from "../src/lib/db";

const STYLES: Array<{
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  images: Array<{ url: string; angle: string; label: string; isPrimary: boolean; colorHex?: string }>;
}> = [
  {
    name: "Closed Front",
    slug: "closed-front",
    description: "Classic seamless silhouette",
    sortOrder: 0,
    images: [
      { url: "/images/daily-1.jpg", angle: "front", label: "Front View", isPrimary: true },
      { url: "/images/daily-3.jpg", angle: "back", label: "Back View", isPrimary: false },
      { url: "/images/daily-4.jpg", angle: "left", label: "Left Side", isPrimary: false },
      { url: "/images/best-1.jpg", angle: "right", label: "Right Side", isPrimary: false },
    ],
  },
  {
    name: "Open Front",
    slug: "open-front",
    description: "Layered with inner dress",
    sortOrder: 1,
    images: [
      { url: "/images/best-2.jpg", angle: "front", label: "Front View", isPrimary: true },
      { url: "/images/new-1.jpg", angle: "back", label: "Back View", isPrimary: false },
      { url: "/images/daily-2.jpg", angle: "left", label: "Left Side", isPrimary: false },
      { url: "/images/new-2.jpg", angle: "right", label: "Right Side", isPrimary: false },
    ],
  },
  {
    name: "Kimono / Flared",
    slug: "kimono-flared",
    description: "Wide, flowing silhouette",
    sortOrder: 2,
    images: [
      { url: "/images/new-2.jpg", angle: "front", label: "Front View", isPrimary: true },
      { url: "/images/best-1.jpg", angle: "back", label: "Back View", isPrimary: false },
      { url: "/images/new-1.jpg", angle: "detail", label: "Detail View", isPrimary: false },
    ],
  },
  {
    name: "Wrap Style",
    slug: "wrap-style",
    description: "Adjustable wrap with belt",
    sortOrder: 3,
    images: [
      { url: "/images/best-2.jpg", angle: "front", label: "Front View", isPrimary: true },
      { url: "/images/daily-1.jpg", angle: "back", label: "Back View", isPrimary: false },
      { url: "/images/daily-3.jpg", angle: "left", label: "Left Side", isPrimary: false },
      { url: "/images/best-1.jpg", angle: "detail", label: "Belt Detail", isPrimary: false },
    ],
  },
];

async function main() {
  console.log("Seeding AbayaStyles + AbayaImages…");

  for (const s of STYLES) {
    const style = await db.abayaStyle.upsert({
      where: { slug: s.slug },
      update: { name: s.name, description: s.description, sortOrder: s.sortOrder },
      create: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        sortOrder: s.sortOrder,
        active: true,
      },
    });

    // Only seed images if the style has none (don't overwrite admin changes)
    const existingImages = await db.abayaImage.count({ where: { abayaStyleId: style.id } });
    if (existingImages > 0) {
      console.log(`  ✓ ${s.name} — already has ${existingImages} images (skipping)`);
      continue;
    }

    for (let i = 0; i < s.images.length; i++) {
      const img = s.images[i];
      await db.abayaImage.create({
        data: {
          abayaStyleId: style.id,
          url: img.url,
          angle: img.angle,
          label: img.label,
          isPrimary: img.isPrimary,
          colorHex: img.colorHex || null,
          sortOrder: i,
        },
      });
    }
    console.log(`  ✓ ${s.name} — ${s.images.length} images`);
  }

  const total = await db.abayaStyle.count();
  const totalImages = await db.abayaImage.count();
  console.log(`\nDone. ${total} styles, ${totalImages} images.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
