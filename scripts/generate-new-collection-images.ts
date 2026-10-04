// scripts/generate-new-collection-images.ts
//
// Generates premium abaya product images for the NEW ShafaQ Atelier collection
// using the z-ai-web-dev-sdk image generation API. Saves images to
// public/images/products/new-collection/{slug}/ so they're served statically
// by Next.js (no Vercel Blob needed for the initial collection — the admin can
// later replace them via the existing upload mechanism).
//
// This script is SAFE to re-run — it skips images that already exist.
// Run with: bun run scripts/generate-new-collection-images.ts

import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUTPUT_BASE = path.join(process.cwd(), "public/images/products/new-collection");

// ---------------------------------------------------------------------------
// Collection definition — 10 unique abaya designs
// ---------------------------------------------------------------------------
type ColorDef = { hex: string; name: string };
type StyleDef = { id: string; name: string; description: string; additionalPrice: number };
type FabricDef = { id: string; name: string; description: string; additionalPrice: number };
type ComboDef = { colorHex: string; styleId: string; fabricId: string; suffix: string };

type ProductDef = {
  slug: string;
  name: string;
  promptSubject: string; // short description for the image prompt
  colors: ColorDef[];
  styles: StyleDef[];
  fabrics: FabricDef[];
  combos: ComboDef[]; // important Color+Style+Fabric combinations to generate images for
};

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const COLLECTION: ProductDef[] = [
  {
    slug: "noor-everyday-abaya",
    name: "Noor Everyday Abaya",
    promptSubject: "elegant simple everyday abaya, clean A-line silhouette, round collar, concealed buttons",
    colors: [
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#6b5246", name: "Mocha" },
      { hex: "#8a9a7b", name: "Sage" },
    ],
    styles: [
      { id: "closed-front", name: "Closed Front", description: "Classic seamless silhouette", additionalPrice: 0 },
      { id: "open-front", name: "Open Front", description: "Layered with inner dress", additionalPrice: 2000 },
      { id: "pleated", name: "Pleated", description: "Soft pleated silhouette", additionalPrice: 1500 },
    ],
    fabrics: [
      { id: "nida", name: "Nida", description: "Soft, buttery, subtle sheen", additionalPrice: 0 },
      { id: "crepe", name: "Matte Crepe", description: "Fluid, breathable, structured", additionalPrice: 1000 },
      { id: "chiffon", name: "Chiffon", description: "Lightweight, airy, layered", additionalPrice: 1500 },
    ],
    combos: [
      { colorHex: "#1a1a1a", styleId: "closed-front", fabricId: "nida", suffix: "black-closed-nida" },
      { colorHex: "#1a1a1a", styleId: "open-front", fabricId: "crepe", suffix: "black-open-crepe" },
      { colorHex: "#6b5246", styleId: "pleated", fabricId: "nida", suffix: "mocha-pleated-nida" },
    ],
  },
  {
    slug: "sahar-pleated-abaya",
    name: "Sahar Pleated Abaya",
    promptSubject: "luxurious pleated abaya with flowing accordion pleats, dramatic silhouette",
    colors: [
      { hex: "#3a3633", name: "Charcoal" },
      { hex: "#b87878", name: "Dusty Rose" },
      { hex: "#1a6b6b", name: "Teal" },
    ],
    styles: [
      { id: "pleated", name: "Pleated", description: "Full accordion pleats", additionalPrice: 0 },
      { id: "open-front", name: "Open Front", description: "Pleated open front", additionalPrice: 2500 },
      { id: "bell-sleeve", name: "Bell Sleeve", description: "Pleated with bell sleeves", additionalPrice: 2000 },
    ],
    fabrics: [
      { id: "satin-crepe", name: "Satin Crepe", description: "Lustrous, elegant drape", additionalPrice: 2000 },
      { id: "silk", name: "Silk Blend", description: "Premium, luxurious feel", additionalPrice: 5000 },
      { id: "chiffon", name: "Chiffon", description: "Lightweight, airy", additionalPrice: 1500 },
    ],
    combos: [
      { colorHex: "#3a3633", styleId: "pleated", fabricId: "satin-crepe", suffix: "charcoal-pleated-satin" },
      { colorHex: "#b87878", styleId: "pleated", fabricId: "silk", suffix: "rose-pleated-silk" },
      { colorHex: "#1a6b6b", styleId: "open-front", fabricId: "chiffon", suffix: "teal-open-chiffon" },
    ],
  },
  {
    slug: "ayla-open-front-abaya",
    name: "Ayla Open-Front Abaya",
    promptSubject: "sophisticated open-front abaya with layered inner dress, flowing cardigan style",
    colors: [
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#2a3441", name: "Navy" },
      { hex: "#e8dcc4", name: "Cream" },
    ],
    styles: [
      { id: "open-front", name: "Open Front", description: "Layered cardigan style", additionalPrice: 0 },
      { id: "closed-front", name: "Closed Front", description: "Closed with belt", additionalPrice: 1000 },
      { id: "wrap", name: "Wrap Style", description: "Adjustable wrap with belt", additionalPrice: 3000 },
    ],
    fabrics: [
      { id: "nida", name: "Nida", description: "Soft, buttery", additionalPrice: 0 },
      { id: "chiffon", name: "Chiffon", description: "Lightweight, airy", additionalPrice: 1500 },
      { id: "silk", name: "Silk Blend", description: "Premium silk", additionalPrice: 5000 },
    ],
    combos: [
      { colorHex: "#1a1a1a", styleId: "open-front", fabricId: "nida", suffix: "black-open-nida" },
      { colorHex: "#1a1a1a", styleId: "open-front", fabricId: "silk", suffix: "black-open-silk" },
      { colorHex: "#2a3441", styleId: "wrap", fabricId: "chiffon", suffix: "navy-wrap-chiffon" },
    ],
  },
  {
    slug: "zara-bell-sleeve-abaya",
    name: "Zara Bell-Sleeve Abaya",
    promptSubject: "dramatic bell-sleeve abaya with flared cuffs, elegant statement piece",
    colors: [
      { hex: "#5c1a2b", name: "Burgundy" },
      { hex: "#1a4d3a", name: "Forest" },
      { hex: "#c9a24b", name: "Gold" },
    ],
    styles: [
      { id: "bell-sleeve", name: "Bell Sleeve", description: "Dramatic flared bell", additionalPrice: 0 },
      { id: "flared", name: "Flared Sleeve", description: "Gentle flare from elbow", additionalPrice: 500 },
      { id: "cuffed", name: "Cuffed Sleeve", description: "Fold-back cuffs", additionalPrice: 800 },
    ],
    fabrics: [
      { id: "heavyweight-crepe", name: "Heavyweight Crepe", description: "Structured, premium weight", additionalPrice: 3000 },
      { id: "satin-crepe", name: "Satin Crepe", description: "Lustrous, elegant", additionalPrice: 2000 },
      { id: "silk", name: "Silk Blend", description: "Premium silk", additionalPrice: 5000 },
    ],
    combos: [
      { colorHex: "#5c1a2b", styleId: "bell-sleeve", fabricId: "heavyweight-crepe", suffix: "burgundy-bell-heavy" },
      { colorHex: "#1a4d3a", styleId: "bell-sleeve", fabricId: "satin-crepe", suffix: "forest-bell-satin" },
      { colorHex: "#c9a24b", styleId: "flared", fabricId: "silk", suffix: "gold-flared-silk" },
    ],
  },
  {
    slug: "leila-silk-wrap-abaya",
    name: "Leila Silk Wrap Abaya",
    promptSubject: "luxurious silk wrap abaya with adjustable belt, flowing premium fabric",
    colors: [
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#9a7a8a", name: "Mauve" },
      { hex: "#e8d4a8", name: "Champagne" },
    ],
    styles: [
      { id: "wrap", name: "Wrap Style", description: "Adjustable wrap with belt", additionalPrice: 0 },
      { id: "open-front", name: "Open Front", description: "Open without belt", additionalPrice: -500 },
      { id: "pleated", name: "Pleated", description: "Wrap with pleats", additionalPrice: 2000 },
    ],
    fabrics: [
      { id: "silk", name: "Silk Blend", description: "Premium, luxurious", additionalPrice: 0 },
      { id: "satin-crepe", name: "Satin Crepe", description: "Lustrous alternative", additionalPrice: -1500 },
      { id: "chiffon", name: "Chiffon", description: "Lightweight overlay", additionalPrice: -2000 },
    ],
    combos: [
      { colorHex: "#1a1a1a", styleId: "wrap", fabricId: "silk", suffix: "black-wrap-silk" },
      { colorHex: "#9a7a8a", styleId: "wrap", fabricId: "silk", suffix: "mauve-wrap-silk" },
      { colorHex: "#e8d4a8", styleId: "pleated", fabricId: "silk", suffix: "champagne-pleated-silk" },
    ],
  },
  {
    slug: "rania-embroidered-abaya",
    name: "Rania Embroidered Abaya",
    promptSubject: "exquisite embroidered abaya with gold thread work along cuffs and neckline",
    colors: [
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#6b1f2e", name: "Maroon" },
      { hex: "#1e6b50", name: "Emerald" },
    ],
    styles: [
      { id: "embroidered", name: "Gold Embroidery", description: "Hand-embroidered gold work", additionalPrice: 0 },
      { id: "minimal", name: "Minimal Cuff", description: "Subtle cuff embroidery", additionalPrice: -2000 },
      { id: "full", name: "Full Embroidery", description: "All-over intricate design", additionalPrice: 4000 },
    ],
    fabrics: [
      { id: "heavyweight-crepe", name: "Heavyweight Crepe", description: "Structured premium base", additionalPrice: 0 },
      { id: "satin-crepe", name: "Satin Crepe", description: "Lustrous elegant base", additionalPrice: 2000 },
      { id: "silk", name: "Silk Blend", description: "Premium silk base", additionalPrice: 5000 },
    ],
    combos: [
      { colorHex: "#1a1a1a", styleId: "embroidered", fabricId: "heavyweight-crepe", suffix: "black-gold-crepe" },
      { colorHex: "#6b1f2e", styleId: "full", fabricId: "silk", suffix: "maroon-full-silk" },
      { colorHex: "#1e6b50", styleId: "embroidered", fabricId: "satin-crepe", suffix: "emerald-gold-satin" },
    ],
  },
  {
    slug: "yasmin-kimono-abaya",
    name: "Yasmin Kimono Abaya",
    promptSubject: "flowing kimono-style abaya with wide flared sleeves and relaxed silhouette",
    colors: [
      { hex: "#d8c7a8", name: "Beige" },
      { hex: "#6b7a3a", name: "Olive" },
      { hex: "#a84c2c", name: "Rust" },
    ],
    styles: [
      { id: "kimono", name: "Kimono Flared", description: "Wide, flowing kimono silhouette", additionalPrice: 0 },
      { id: "open-front", name: "Open Front", description: "Open kimono front", additionalPrice: 1000 },
      { id: "bell-sleeve", name: "Bell Sleeve", description: "Kimono with bell sleeves", additionalPrice: 2000 },
    ],
    fabrics: [
      { id: "travel-crepe", name: "Travel Crepe", description: "Wrinkle-resistant, packable", additionalPrice: 0 },
      { id: "layered-crepe", name: "Layered Crepe", description: "Double-layered, flowing", additionalPrice: 1500 },
      { id: "chiffon", name: "Chiffon", description: "Lightweight, airy", additionalPrice: 1500 },
    ],
    combos: [
      { colorHex: "#d8c7a8", styleId: "kimono", fabricId: "travel-crepe", suffix: "beige-kimono-travel" },
      { colorHex: "#6b7a3a", styleId: "open-front", fabricId: "layered-crepe", suffix: "olive-open-layered" },
      { colorHex: "#a84c2c", styleId: "bell-sleeve", fabricId: "chiffon", suffix: "rust-bell-chiffon" },
    ],
  },
  {
    slug: "amira-classic-abaya",
    name: "Amira Classic Abaya",
    promptSubject: "timeless classic abaya with clean lines, modest round collar, straight cut",
    colors: [
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#3a3633", name: "Charcoal" },
      { hex: "#6b5246", name: "Mocha" },
    ],
    styles: [
      { id: "classic", name: "Classic Straight", description: "Timeless straight cut", additionalPrice: 0 },
      { id: "a-line", name: "A-Line", description: "Slightly flared A-line", additionalPrice: 1000 },
      { id: "pleated", name: "Pleated", description: "Classic with pleats", additionalPrice: 2000 },
    ],
    fabrics: [
      { id: "nida", name: "Nida", description: "Soft, buttery", additionalPrice: 0 },
      { id: "matte-crepe", name: "Matte Crepe", description: "Fluid, breathable", additionalPrice: 1000 },
      { id: "heavyweight-crepe", name: "Heavyweight Crepe", description: "Structured premium", additionalPrice: 3000 },
    ],
    combos: [
      { colorHex: "#1a1a1a", styleId: "classic", fabricId: "nida", suffix: "black-classic-nida" },
      { colorHex: "#3a3633", styleId: "a-line", fabricId: "matte-crepe", suffix: "charcoal-aline-crepe" },
      { colorHex: "#6b5246", styleId: "pleated", fabricId: "heavyweight-crepe", suffix: "mocha-pleated-heavy" },
    ],
  },
  {
    slug: "sofia-chiffon-abaya",
    name: "Sofia Chiffon Abaya",
    promptSubject: "ethereal layered chiffon abaya with flowing translucent fabric, romantic silhouette",
    colors: [
      { hex: "#e8c4c4", name: "Blush" },
      { hex: "#c4b0d4", name: "Lavender" },
      { hex: "#a8c4e8", name: "Sky" },
    ],
    styles: [
      { id: "layered", name: "Layered Chiffon", description: "Multi-layer flowing chiffon", additionalPrice: 0 },
      { id: "open-front", name: "Open Front", description: "Open chiffon overlay", additionalPrice: 1500 },
      { id: "pleated", name: "Pleated", description: "Pleated chiffon", additionalPrice: 2000 },
    ],
    fabrics: [
      { id: "chiffon", name: "Chiffon", description: "Lightweight, airy, layered", additionalPrice: 0 },
      { id: "layered-crepe", name: "Layered Crepe", description: "Double-layered with chiffon overlay", additionalPrice: 2000 },
      { id: "silk", name: "Silk Blend", description: "Premium silk-chiffon blend", additionalPrice: 5000 },
    ],
    combos: [
      { colorHex: "#e8c4c4", styleId: "layered", fabricId: "chiffon", suffix: "blush-layered-chiffon" },
      { colorHex: "#c4b0d4", styleId: "open-front", fabricId: "silk", suffix: "lavender-open-silk" },
      { colorHex: "#a8c4e8", styleId: "pleated", fabricId: "layered-crepe", suffix: "sky-pleated-layered" },
    ],
  },
  {
    slug: "maryam-couture-abaya",
    name: "Maryam Couture Abaya",
    promptSubject: "haute couture abaya with intricate embellishment, premium beading, statement luxury piece",
    colors: [
      { hex: "#1a1a1a", name: "Black" },
      { hex: "#c9a24b", name: "Gold" },
      { hex: "#722f37", name: "Wine" },
    ],
    styles: [
      { id: "couture", name: "Couture Embellished", description: "Full hand-embellished couture piece", additionalPrice: 0 },
      { id: "minimal", name: "Minimal Couture", description: "Subtle beading accents", additionalPrice: -3000 },
      { id: "full", name: "Full Embellished", description: "All-over intricate beading", additionalPrice: 5000 },
    ],
    fabrics: [
      { id: "silk", name: "Silk Blend", description: "Premium silk base", additionalPrice: 0 },
      { id: "satin-crepe", name: "Satin Crepe", description: "Lustrous satin base", additionalPrice: -1000 },
      { id: "heavyweight-crepe", name: "Heavyweight Crepe", description: "Structured couture base", additionalPrice: 2000 },
    ],
    combos: [
      { colorHex: "#1a1a1a", styleId: "couture", fabricId: "silk", suffix: "black-couture-silk" },
      { colorHex: "#c9a24b", styleId: "full", fabricId: "silk", suffix: "gold-full-silk" },
      { colorHex: "#722f37", styleId: "couture", fabricId: "heavyweight-crepe", suffix: "wine-couture-heavy" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Image generation helper
// ---------------------------------------------------------------------------

function colorNameFromHex(hex: string): string {
  const map: Record<string, string> = {
    "#1a1a1a": "black", "#6b5246": "mocha", "#8a9a7b": "sage",
    "#3a3633": "charcoal", "#b87878": "dusty rose", "#1a6b6b": "teal",
    "#2a3441": "navy", "#e8dcc4": "cream",
    "#5c1a2b": "burgundy", "#1a4d3a": "forest green", "#c9a24b": "gold",
    "#9a7a8a": "mauve", "#e8d4a8": "champagne",
    "#6b1f2e": "maroon", "#1e6b50": "emerald green",
    "#d8c7a8": "beige", "#6b7a3a": "olive", "#a84c2c": "rust",
    "#e8c4c4": "blush pink", "#c4b0d4": "lavender", "#a8c4e8": "sky blue",
    "#722f37": "wine",
  };
  return map[hex.toLowerCase()] || hex;
}

function buildPrompt(product: ProductDef, color: ColorDef): string {
  const colorName = colorNameFromHex(color.hex);
  return `Professional fashion product photography of a ${colorName} ${product.promptSubject}, premium abaya dress on invisible mannequin, studio lighting, soft white background, full-length view, high-end e-commerce, photorealistic, high quality, detailed fabric texture`;
}

function buildComboPrompt(product: ProductDef, combo: ComboDef): string {
  const color = product.colors.find((c) => c.hex === combo.colorHex);
  const style = product.styles.find((s) => s.id === combo.styleId);
  const fabric = product.fabrics.find((f) => f.id === combo.fabricId);
  const colorName = color ? colorNameFromHex(color.hex) : "";
  return `Professional fashion product photography of a ${colorName} abaya, ${style?.description || ""}, ${fabric?.description || ""}, ${product.promptSubject}, premium abaya dress on invisible mannequin, studio lighting, soft white background, full-length view, high-end e-commerce, photorealistic, detailed`;
}

async function generateImage(zai: Awaited<ReturnType<typeof ZAI.create>>, prompt: string, outputPath: string): Promise<boolean> {
  if (fs.existsSync(outputPath)) {
    console.log(`  [skip] ${path.basename(outputPath)} (already exists)`);
    return true;
  }
  try {
    const response = await zai.images.generations.create({
      prompt: prompt,
      size: "768x1344",
    });
    const base64 = response.data[0].base64;
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(outputPath, buffer);
    console.log(`  [ok] ${path.basename(outputPath)} (${(buffer.length / 1024).toFixed(0)} KB)`);
    return true;
  } catch (e) {
    console.error(`  [FAIL] ${path.basename(outputPath)}: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[gen-images] Starting image generation for new collection...");

  // Ensure base directory exists
  fs.mkdirSync(OUTPUT_BASE, { recursive: true });

  const zai = await ZAI.create();

  let total = 0;
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of COLLECTION) {
    const productDir = path.join(OUTPUT_BASE, product.slug);
    fs.mkdirSync(productDir, { recursive: true });

    console.log(`\n=== ${product.name} (${product.slug}) ===`);

    // 1. Color-specific images (one per color — these become both the
    //    colorImages AND the default product gallery images).
    for (const color of product.colors) {
      const filename = `${colorNameFromHex(color.hex).replace(/\s+/g, "-")}-1.png`;
      const outPath = path.join(productDir, filename);
      total++;
      if (fs.existsSync(outPath)) {
        console.log(`  [skip] ${filename}`);
        skipped++;
        continue;
      }
      const ok = await generateImage(zai, buildPrompt(product, color), outPath);
      if (ok) generated++; else failed++;
    }

    // 2. Combination images (for important Color+Style+Fabric combos).
    for (const combo of product.combos) {
      const filename = `${combo.suffix}.png`;
      const outPath = path.join(productDir, filename);
      total++;
      if (fs.existsSync(outPath)) {
        console.log(`  [skip] ${filename}`);
        skipped++;
        continue;
      }
      const ok = await generateImage(zai, buildComboPrompt(product, combo), outPath);
      if (ok) generated++; else failed++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total image slots: ${total}`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (already existed): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log("[gen-images] DONE.");
}

main().catch((e) => {
  console.error("[gen-images] FATAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
