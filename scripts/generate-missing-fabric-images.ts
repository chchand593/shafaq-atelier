// scripts/generate-missing-fabric-images.ts
//
// Generates the 5 missing fabric-specific combination images for V11.
// Uses z-ai-web-dev-sdk image generation API.
// Idempotent — skips images that already exist.
//
// Run: bun run scripts/generate-missing-fabric-images.ts

import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUTPUT_BASE = path.join(process.cwd(), "public/images/products/new-collection");

type ImageToGenerate = {
  slug: string;
  filename: string;
  prompt: string;
};

// 5 missing images — one per missing fabric per product
// Using the product's first color + first style for consistency with existing combos
const IMAGES: ImageToGenerate[] = [
  {
    slug: "noor-everyday-abaya",
    filename: "sage-pleated-chiffon.png",
    prompt:
      "Professional fashion product photography of a sage green abaya, soft pleated silhouette, lightweight airy layered chiffon fabric, elegant simple everyday abaya with clean A-line silhouette and round collar, premium abaya dress on invisible mannequin, studio lighting, soft white background, full-length view, high-end e-commerce, photorealistic, detailed fabric texture",
  },
  {
    slug: "zara-bell-sleeve-abaya",
    filename: "gold-bell-silk.png",
    prompt:
      "Professional fashion product photography of a gold colored abaya, dramatic bell sleeves with flared cuffs, premium silk blend fabric with luxurious sheen, statement piece with structured drape, premium abaya dress on invisible mannequin, studio lighting, soft white background, full-length view, high-end e-commerce, photorealistic, detailed fabric texture",
  },
  {
    slug: "leila-silk-wrap-abaya",
    filename: "black-wrap-satin.png",
    prompt:
      "Professional fashion product photography of a black abaya, adjustable wrap style with belt, lustrous satin crepe fabric with elegant drape, luxurious silk wrap abaya, premium abaya dress on invisible mannequin, studio lighting, soft white background, full-length view, high-end e-commerce, photorealistic, detailed fabric texture",
  },
  {
    slug: "leila-silk-wrap-abaya",
    filename: "mauve-open-chiffon.png",
    prompt:
      "Professional fashion product photography of a mauve colored abaya, open front style, lightweight airy chiffon fabric, luxurious wrap abaya with flowing overlay, premium abaya dress on invisible mannequin, studio lighting, soft white background, full-length view, high-end e-commerce, photorealistic, detailed fabric texture",
  },
  {
    slug: "maryam-couture-abaya",
    filename: "black-couture-satin.png",
    prompt:
      "Professional fashion product photography of a black abaya, couture embellished with hand-embellished beading, lustrous satin crepe fabric with elegant drape, haute couture luxury piece, premium abaya dress on invisible mannequin, studio lighting, soft white background, full-length view, high-end e-commerce, photorealistic, detailed fabric texture",
  },
];

async function main() {
  console.log("[gen-missing-fabric-images] Starting...");
  const zai = await ZAI.create();

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const img of IMAGES) {
    const outPath = path.join(OUTPUT_BASE, img.slug, img.filename);
    if (fs.existsSync(outPath)) {
      console.log(`  [skip] ${img.slug}/${img.filename} (already exists)`);
      skipped++;
      continue;
    }
    try {
      console.log(`  [generating] ${img.slug}/${img.filename}...`);
      const response = await zai.images.generations.create({
        prompt: img.prompt,
        size: "768x1344",
      });
      const base64 = response.data[0].base64;
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(outPath, buffer);
      console.log(`  [ok] ${img.slug}/${img.filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
      generated++;
    } catch (e) {
      console.error(`  [FAIL] ${img.slug}/${img.filename}: ${e instanceof Error ? e.message : e}`);
      failed++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log("[gen-missing-fabric-images] DONE.");
}

main().catch((e) => {
  console.error("[gen-missing-fabric-images] FATAL:", e);
  process.exit(1);
});
