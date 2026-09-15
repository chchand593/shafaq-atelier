import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { PRODUCTS, ALL_SIZES } from "@/lib/site-data";

export const dynamic = "force-dynamic";

// GET /api/admin/setup?secret=YOUR_SECRET
// One-time browser-friendly setup endpoint. Creates admin user + products +
// colors + fabrics + options + abaya styles in the production database.
//
// Security: requires SETUP_SECRET env var matching the ?secret= query param.
// Idempotent — safe to run multiple times (upsert/create-or-skip logic).
// Returns HTML for easy browser viewing.

const ADMIN_EMAIL = "admin@shafaqatelier.pk";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_NAME = "ShafaQ Admin";

// --- Colors (105+) ---
const COLORS_LIST = [
  { name: "Black", hex: "#1a1a1a", sortOrder: 0 },
  { name: "Charcoal", hex: "#3a3633", sortOrder: 1 },
  { name: "Mocha", hex: "#6b5246", sortOrder: 2 },
  { name: "Beige", hex: "#d8c7a8", sortOrder: 3 },
  { name: "Cream", hex: "#e8dcc4", sortOrder: 4 },
  { name: "Taupe", hex: "#85735e", sortOrder: 5 },
  { name: "Gold", hex: "#c9a24b", sortOrder: 6 },
  { name: "Sage", hex: "#8a9a7b", sortOrder: 7 },
  { name: "Sage Green", hex: "#8a9a7b", sortOrder: 7 },
  { name: "Navy", hex: "#2a3441", sortOrder: 8 },
  { name: "Ivory", hex: "#f4f1ea", sortOrder: 9 },
  { name: "Maroon", hex: "#6b1f2e", sortOrder: 10 },
  { name: "Burgundy", hex: "#5c1a2b", sortOrder: 11 },
  { name: "Wine", hex: "#722f37", sortOrder: 12 },
  { name: "Emerald", hex: "#1e6b50", sortOrder: 13 },
  { name: "Forest Green", hex: "#1a4d3a", sortOrder: 14 },
  { name: "Olive", hex: "#6b7a3a", sortOrder: 15 },
  { name: "Sapphire", hex: "#1e3a6b", sortOrder: 16 },
  { name: "Royal Blue", hex: "#2a4ba0", sortOrder: 17 },
  { name: "Teal", hex: "#1a6b6b", sortOrder: 18 },
  { name: "Peacock", hex: "#1a5a6b", sortOrder: 19 },
  { name: "Plum", hex: "#5c2a5c", sortOrder: 20 },
  { name: "Amethyst", hex: "#7b4b9a", sortOrder: 21 },
  { name: "Ruby", hex: "#9b1c3c", sortOrder: 22 },
  { name: "Garnet", hex: "#7a1c2e", sortOrder: 23 },
  { name: "Indigo", hex: "#3a3a6b", sortOrder: 24 },
  { name: "Chocolate", hex: "#4a3428", sortOrder: 25 },
  { name: "Cocoa", hex: "#5c4234", sortOrder: 26 },
  { name: "Espresso", hex: "#3b2a20", sortOrder: 27 },
  { name: "Caramel", hex: "#b5895a", sortOrder: 28 },
  { name: "Honey", hex: "#d4a55e", sortOrder: 29 },
  { name: "Amber", hex: "#c4862e", sortOrder: 30 },
  { name: "Bronze", hex: "#9a7b4a", sortOrder: 31 },
  { name: "Copper", hex: "#b87333", sortOrder: 32 },
  { name: "Rust", hex: "#a84c2c", sortOrder: 33 },
  { name: "Terracotta", hex: "#c66b3d", sortOrder: 34 },
  { name: "Clay", hex: "#a0603a", sortOrder: 35 },
  { name: "Sand", hex: "#d4b896", sortOrder: 36 },
  { name: "Khaki", hex: "#9a8a6b", sortOrder: 37 },
  { name: "Stone", hex: "#8a8278", sortOrder: 38 },
  { name: "Walnut", hex: "#5c3d2e", sortOrder: 39 },
  { name: "Blush Pink", hex: "#e8c4c4", sortOrder: 40 },
  { name: "Rose", hex: "#d49a9a", sortOrder: 41 },
  { name: "Dusty Rose", hex: "#b87878", sortOrder: 42 },
  { name: "Peach", hex: "#f0c8a8", sortOrder: 43 },
  { name: "Coral", hex: "#e8886a", sortOrder: 44 },
  { name: "Mint", hex: "#a8d4b8", sortOrder: 45 },
  { name: "Seafoam", hex: "#7ac4a8", sortOrder: 46 },
  { name: "Sky Blue", hex: "#a8c4e8", sortOrder: 47 },
  { name: "Powder Blue", hex: "#b8d0e0", sortOrder: 48 },
  { name: "Lavender", hex: "#c4b0d4", sortOrder: 49 },
  { name: "Lilac", hex: "#b89ac4", sortOrder: 50 },
  { name: "Pale Yellow", hex: "#f0e8b8", sortOrder: 51 },
  { name: "Buttermilk", hex: "#f4eac8", sortOrder: 52 },
  { name: "Champagne", hex: "#e8d4a8", sortOrder: 53 },
  { name: "Pearl", hex: "#eae6dc", sortOrder: 54 },
  { name: "Light Grey", hex: "#c4c0b8", sortOrder: 55 },
  { name: "Silver Grey", hex: "#b0aca4", sortOrder: 56 },
  { name: "Dove Grey", hex: "#9a9690", sortOrder: 57 },
  { name: "Slate", hex: "#6a6660", sortOrder: 58 },
  { name: "Gunmetal", hex: "#4a4640", sortOrder: 59 },
  { name: "Graphite", hex: "#3a3633", sortOrder: 60 },
  { name: "Onyx", hex: "#1c1c1c", sortOrder: 61 },
  { name: "Ash", hex: "#8a8480", sortOrder: 62 },
  { name: "Smoke", hex: "#5a564f", sortOrder: 63 },
  { name: "Steel", hex: "#5a6470", sortOrder: 64 },
  { name: "Cobalt", hex: "#1a4ba0", sortOrder: 65 },
  { name: "Denim", hex: "#3a5a7a", sortOrder: 66 },
  { name: "Midnight", hex: "#1a1a3a", sortOrder: 67 },
  { name: "Periwinkle", hex: "#7a8ac4", sortOrder: 68 },
  { name: "Cornflower", hex: "#5a7ab8", sortOrder: 69 },
  { name: "Steel Blue", hex: "#4a6a8a", sortOrder: 70 },
  { name: "Ocean", hex: "#1a5a7a", sortOrder: 71 },
  { name: "Aquamarine", hex: "#5ac4b8", sortOrder: 72 },
  { name: "Turquoise", hex: "#2ab8a8", sortOrder: 73 },
  { name: "Cyan", hex: "#1aa8b8", sortOrder: 74 },
  { name: "Hunter Green", hex: "#1a3a2a", sortOrder: 75 },
  { name: "Pine", hex: "#1a4a2a", sortOrder: 76 },
  { name: "Moss", hex: "#5a6a3a", sortOrder: 77 },
  { name: "Fern", hex: "#6a8a4a", sortOrder: 78 },
  { name: "Jade", hex: "#1a8a6a", sortOrder: 79 },
  { name: "Pistachio", hex: "#a8c46a", sortOrder: 80 },
  { name: "Lime", hex: "#7ab84a", sortOrder: 81 },
  { name: "Chartreuse", hex: "#8ac42a", sortOrder: 82 },
  { name: "Khaki Green", hex: "#5a6a3a", sortOrder: 83 },
  { name: "Bottle Green", hex: "#1a3a1a", sortOrder: 84 },
  { name: "Crimson", hex: "#9b1c2c", sortOrder: 85 },
  { name: "Scarlet", hex: "#c41e3a", sortOrder: 86 },
  { name: "Cherry", hex: "#8b1c2c", sortOrder: 87 },
  { name: "Magenta", hex: "#8b2c6b", sortOrder: 88 },
  { name: "Fuchsia", hex: "#b83c7a", sortOrder: 89 },
  { name: "Hot Pink", hex: "#e84a8a", sortOrder: 90 },
  { name: "Salmon", hex: "#e89a8a", sortOrder: 91 },
  { name: "Watermelon", hex: "#e86a7a", sortOrder: 92 },
  { name: "Berry", hex: "#7a1c3a", sortOrder: 93 },
  { name: "Brick", hex: "#8b3a2a", sortOrder: 94 },
  { name: "Mahogany", hex: "#5c2a1a", sortOrder: 95 },
  { name: "Rosewood", hex: "#6b2a2a", sortOrder: 96 },
  { name: "Marigold", hex: "#e8a02a", sortOrder: 97 },
  { name: "Saffron", hex: "#e8842a", sortOrder: 98 },
  { name: "Tangerine", hex: "#e86a2a", sortOrder: 99 },
  { name: "Mauve", hex: "#9a7a8a", sortOrder: 100 },
  { name: "Eggplant", hex: "#3a2a3a", sortOrder: 101 },
  { name: "Midnight Blue", hex: "#10104a", sortOrder: 102 },
  { name: "Steel Grey", hex: "#4a4a5a", sortOrder: 103 },
  { name: "Warm Grey", hex: "#8a7a6a", sortOrder: 104 },
];

// --- Fabrics ---
const FABRICS = [
  { name: "Washed Nida", description: "Soft, buttery, subtle sheen", additionalPrice: 0, themeValue: "#d4c8b8", sortOrder: 0 },
  { name: "Matte Crepe", description: "Fluid, breathable, structured", additionalPrice: 1000, themeValue: "#8a8278", sortOrder: 1 },
  { name: "Satin Crepe", description: "Lustrous, elegant drape", additionalPrice: 2000, themeValue: "#c4b8c8", sortOrder: 2 },
  { name: "Chiffon", description: "Lightweight, airy, layered", additionalPrice: 1500, themeValue: "#e4d8d0", sortOrder: 3 },
  { name: "Silk Blend", description: "Premium, luxurious feel", additionalPrice: 5000, themeValue: "#d4c4a4", sortOrder: 4 },
  { name: "Heavyweight Crepe", description: "Structured, premium weight", additionalPrice: 3000, themeValue: "#6a625a", sortOrder: 5 },
  { name: "Travel Crepe", description: "Wrinkle-resistant, packable", additionalPrice: 1200, themeValue: "#7a7268", sortOrder: 6 },
  { name: "Layered Crepe", description: "Double-layered, flowing", additionalPrice: 2500, themeValue: "#9a8a7a", sortOrder: 7 },
];

// --- Customization Options ---
const OPTIONS = [
  { name: "Closed Front", description: "Classic seamless silhouette", optionType: "style", additionalPrice: 0, sortOrder: 0 },
  { name: "Open Front", description: "Layered with inner dress", optionType: "style", additionalPrice: 0, sortOrder: 1 },
  { name: "Kimono / Flared", description: "Wide, flowing silhouette", optionType: "style", additionalPrice: 2000, sortOrder: 2 },
  { name: "Wrap Style", description: "Adjustable wrap with belt", optionType: "style", additionalPrice: 3000, sortOrder: 3 },
  { name: "Standard Cuff", description: "Clean fitted cuff", optionType: "sleeves", additionalPrice: 0, sortOrder: 0 },
  { name: "Bell Sleeves", description: "Dramatic flared bell", optionType: "sleeves", additionalPrice: 1500, sortOrder: 1 },
  { name: "Flared Sleeves", description: "Gentle flare from elbow", optionType: "sleeves", additionalPrice: 1000, sortOrder: 2 },
  { name: "Cuffed Sleeves", description: "Fold-back cuffs", optionType: "sleeves", additionalPrice: 800, sortOrder: 3 },
  { name: "Button Detail", description: "Decorative button placket", optionType: "sleeves", additionalPrice: 1200, sortOrder: 4 },
  { name: "None (abaya only)", description: "Abaya without headwear", optionType: "hijab", additionalPrice: 0, sortOrder: 0 },
  { name: "Matching Shayla", description: "Coordinating scarf", optionType: "hijab", additionalPrice: 1500, sortOrder: 1 },
  { name: "Contrasting Shayla", description: "Contrast colour scarf", optionType: "hijab", additionalPrice: 1500, sortOrder: 2 },
  { name: "Matching Khimar", description: "Full head + shoulder cover", optionType: "hijab", additionalPrice: 2500, sortOrder: 3 },
  { name: "Embroidered Shayla", description: "Scarf with gold trim", optionType: "hijab", additionalPrice: 3000, sortOrder: 4 },
  { name: "None", description: "Clean, minimal", optionType: "embroidery", additionalPrice: 0, sortOrder: 0 },
  { name: "Minimal Cuff", description: "Subtle detailing on cuffs", optionType: "embroidery", additionalPrice: 2000, sortOrder: 1 },
  { name: "Sleeve Border", description: "Decorative border along sleeves", optionType: "embroidery", additionalPrice: 3500, sortOrder: 2 },
  { name: "Front Placket", description: "Embroidery along the front", optionType: "embroidery", additionalPrice: 4000, sortOrder: 3 },
  { name: "Full Embroidery", description: "All-over intricate design", optionType: "embroidery", additionalPrice: 8000, sortOrder: 4 },
  { name: "Gold Thread", description: "Hand-embroidered gold work", optionType: "embroidery", additionalPrice: 5000, sortOrder: 5 },
  { name: "Belt", description: "Coordinating belt", optionType: "details", additionalPrice: 1000, sortOrder: 0 },
  { name: "Pockets", description: "Hidden side pockets", optionType: "details", additionalPrice: 500, sortOrder: 1 },
  { name: "Buttons", description: "Decorative buttons", optionType: "details", additionalPrice: 800, sortOrder: 2 },
  { name: "Hood", description: "Attached hood", optionType: "details", additionalPrice: 1500, sortOrder: 3 },
  { name: "Zipper Closure", description: "Front zipper", optionType: "details", additionalPrice: 600, sortOrder: 4 },
  { name: "Inner Dress", description: "Matching inner dress", optionType: "details", additionalPrice: 2500, sortOrder: 5 },
];

// --- Abaya Styles ---
const STYLES = [
  { name: "Closed Front", slug: "closed-front", description: "Classic seamless silhouette", sortOrder: 0, images: [
    { url: "/images/daily-1.jpg", angle: "front", label: "Front View", isPrimary: true, sortOrder: 0 },
    { url: "/images/daily-3.jpg", angle: "back", label: "Back View", isPrimary: false, sortOrder: 1 },
    { url: "/images/daily-4.jpg", angle: "left", label: "Left Side", isPrimary: false, sortOrder: 2 },
    { url: "/images/best-1.jpg", angle: "right", label: "Right Side", isPrimary: false, sortOrder: 3 },
  ]},
  { name: "Open Front", slug: "open-front", description: "Layered with inner dress", sortOrder: 1, images: [
    { url: "/images/best-2.jpg", angle: "front", label: "Front View", isPrimary: true, sortOrder: 0 },
    { url: "/images/new-1.jpg", angle: "back", label: "Back View", isPrimary: false, sortOrder: 1 },
    { url: "/images/daily-2.jpg", angle: "left", label: "Left Side", isPrimary: false, sortOrder: 2 },
    { url: "/images/new-2.jpg", angle: "right", label: "Right Side", isPrimary: false, sortOrder: 3 },
  ]},
  { name: "Kimono / Flared", slug: "kimono-flared", description: "Wide, flowing silhouette", sortOrder: 2, images: [
    { url: "/images/new-2.jpg", angle: "front", label: "Front View", isPrimary: true, sortOrder: 0 },
    { url: "/images/best-1.jpg", angle: "back", label: "Back View", isPrimary: false, sortOrder: 1 },
    { url: "/images/new-1.jpg", angle: "detail", label: "Detail View", isPrimary: false, sortOrder: 2 },
  ]},
  { name: "Wrap Style", slug: "wrap-style", description: "Adjustable wrap with belt", sortOrder: 3, images: [
    { url: "/images/best-2.jpg", angle: "front", label: "Front View", isPrimary: true, sortOrder: 0 },
    { url: "/images/daily-1.jpg", angle: "back", label: "Back View", isPrimary: false, sortOrder: 1 },
    { url: "/images/daily-3.jpg", angle: "left", label: "Left Side", isPrimary: false, sortOrder: 2 },
    { url: "/images/best-1.jpg", angle: "detail", label: "Belt Detail", isPrimary: false, sortOrder: 3 },
  ]},
];

async function runSetup() {
  const results: string[] = [];

  // 1. Admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "admin", passwordHash, name: ADMIN_NAME },
    create: { email: ADMIN_EMAIL, name: ADMIN_NAME, role: "admin", passwordHash },
  });
  results.push("Admin user created: admin@shafaqatelier.pk");

  // 2. Products (8 original)
  for (const p of PRODUCTS) {
    const slug = p.id;
    await db.product.upsert({
      where: { slug },
      update: { name: p.name, category: p.category, price: p.price, originalPrice: p.originalPrice ?? null, image: p.image, colors: JSON.stringify(p.colorOptions), sizes: JSON.stringify(p.sizes), badge: p.badge ?? null, fabric: p.fabric, care: p.care, description: p.description, active: true },
      create: { slug, name: p.name, category: p.category, price: p.price, originalPrice: p.originalPrice ?? null, image: p.image, images: JSON.stringify([p.image]), colorImages: "[]", colors: JSON.stringify(p.colorOptions), sizes: JSON.stringify(p.sizes), badge: p.badge ?? null, fabric: p.fabric, care: p.care, description: p.description, stock: 50, active: true },
    });
  }
  results.push(`${PRODUCTS.length} original products created`);

  // 3. Royal Pleated Abaya
  const royalColors = [
    { hex: "#b87878", name: "Dusty Rose" }, { hex: "#1a6b6b", name: "Teal" }, { hex: "#f0c8a8", name: "Peach" }, { hex: "#3a3633", name: "Charcoal" }, { hex: "#8a9a7b", name: "Sage Green" },
  ];
  const royalColorImages = [
    { colorHex: "#b87878", colorName: "Dusty Rose", image: "/images/products/royal-pleated/dusty-rose-1.webp" },
    { colorHex: "#1a6b6b", colorName: "Teal", image: "/images/products/royal-pleated/teal-1.webp" },
    { colorHex: "#f0c8a8", colorName: "Peach", image: "/images/products/royal-pleated/peach-1.webp" },
    { colorHex: "#3a3633", colorName: "Charcoal", image: "/images/products/royal-pleated/charcoal-1.webp", images: ["/images/products/royal-pleated/charcoal-2.webp"] },
    { colorHex: "#8a9a7b", colorName: "Sage Green", image: "/images/products/royal-pleated/sage-green-1.webp" },
  ];
  const royalGallery = [
    "/images/products/royal-pleated/dusty-rose-1.webp", "/images/products/royal-pleated/teal-1.webp", "/images/products/royal-pleated/peach-1.webp", "/images/products/royal-pleated/charcoal-1.webp", "/images/products/royal-pleated/charcoal-2.webp", "/images/products/royal-pleated/sage-green-1.webp",
  ];
  await db.product.upsert({
    where: { slug: "royal-pleated-abaya" },
    update: { name: "Royal Pleated Abaya — Full Coverage Collection", category: "Daily Wear", price: 12500, image: "/images/products/royal-pleated/dusty-rose-1.webp", images: JSON.stringify(royalGallery), colors: JSON.stringify(royalColors), colorImages: JSON.stringify(royalColorImages), fabric: "Premium pleated crepe", care: "Dry clean recommended", description: "Royal Pleated Abaya — Full Coverage Collection.", badge: "Full Coverage", stock: 25, active: true, isNewArrival: true, isFeatured: true },
    create: { slug: "royal-pleated-abaya", name: "Royal Pleated Abaya — Full Coverage Collection", category: "Daily Wear", price: 12500, image: "/images/products/royal-pleated/dusty-rose-1.webp", images: JSON.stringify(royalGallery), colorImages: JSON.stringify(royalColorImages), colors: JSON.stringify(royalColors), sizes: JSON.stringify(ALL_SIZES), fabric: "Premium pleated crepe", care: "Dry clean recommended", description: "Royal Pleated Abaya — Full Coverage Collection.", badge: "Full Coverage", stock: 25, active: true, isNewArrival: true, isFeatured: true, rating: 5.0, reviewCount: 0 },
  });
  results.push("Royal Pleated Abaya created (5 colors + colorImages)");

  // 4. Section flags
  await db.product.updateMany({ where: { category: "Daily Wear" }, data: { isFeatured: true } });
  await db.product.updateMany({ where: { category: "New Arrivals" }, data: { isNewArrival: true } });
  await db.product.updateMany({ where: { category: "Best Sellers" }, data: { isBestSeller: true } });
  results.push("Section flags set (isNewArrival, isBestSeller, isFeatured)");

  // 5. Colors
  for (const c of COLORS_LIST) {
    await db.color.upsert({ where: { name: c.name }, update: { hex: c.hex, sortOrder: c.sortOrder }, create: c });
  }
  results.push(`${COLORS_LIST.length} colors created`);

  // 6. Fabrics
  for (const f of FABRICS) {
    await db.fabric.upsert({ where: { name: f.name }, update: { description: f.description, additionalPrice: f.additionalPrice, themeValue: f.themeValue, sortOrder: f.sortOrder }, create: f });
  }
  results.push(`${FABRICS.length} fabrics created`);

  // 7. Customization Options
  await db.customizationOption.deleteMany({});
  for (const o of OPTIONS) {
    await db.customizationOption.create({ data: o });
  }
  results.push(`${OPTIONS.length} customization options created`);

  // 8. Abaya Styles + Images
  for (const s of STYLES) {
    const style = await db.abayaStyle.upsert({ where: { slug: s.slug }, update: { name: s.name, description: s.description, sortOrder: s.sortOrder }, create: { name: s.name, slug: s.slug, description: s.description, sortOrder: s.sortOrder, active: true } });
    const existingCount = await db.abayaImage.count({ where: { abayaStyleId: style.id } });
    if (existingCount === 0) {
      for (let i = 0; i < s.images.length; i++) {
        const img = s.images[i];
        await db.abayaImage.create({ data: { abayaStyleId: style.id, url: img.url, angle: img.angle, label: img.label, isPrimary: img.isPrimary, sortOrder: i } });
      }
    }
  }
  results.push(`${STYLES.length} abaya styles with images created`);

  const productCount = await db.product.count();
  const activeCount = await db.product.count({ where: { active: true } });
  const userCount = await db.user.count();

  return { results, productCount, activeCount, userCount };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expectedSecret = process.env.SETUP_SECRET;

  if (!expectedSecret) {
    return htmlResponse("SETUP_SECRET not configured", "Add SETUP_SECRET in Vercel → Settings → Environment Variables", 500);
  }
  if (secret !== expectedSecret) {
    return htmlResponse("Unauthorized", "Wrong or missing ?secret= parameter", 401);
  }

  try {
    const { results, productCount, activeCount, userCount } = await runSetup();

    const stepsHtml = results.map((r) => `<div style="display:flex;align-items:flex-start;gap:12px;padding:8px 0;"><span style="color:#22c55e;font-size:20px;flex-shrink:0;">✓</span><span>${r}</span></div>`).join("");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>ShafaQ Atelier — Setup Complete</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#1a1a1a;margin:0;padding:40px 20px}.container{max-width:600px;margin:0 auto}h1{font-size:28px;font-weight:600;margin:0 0 24px}.card{background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin-bottom:16px}.creds{background:#f4f4f5;border-radius:8px;padding:16px;margin-top:16px}.creds p{margin:4px 0;font-size:14px}.warning{background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-top:16px;font-size:13px}.counts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}.cb{background:#f4f4f5;border-radius:8px;padding:12px;text-align:center}.cb .n{font-size:24px;font-weight:700}.cb .l{font-size:12px;color:#71717a}a{color:#c9a24b}</style></head><body><div class="container"><h1>✅ Setup Complete</h1><div class="card">${stepsHtml}</div><div class="counts"><div class="cb"><div class="n">${productCount}</div><div class="l">Products</div></div><div class="cb"><div class="n">${activeCount}</div><div class="l">Active</div></div><div class="cb"><div class="n">${userCount}</div><div class="l">Users</div></div></div><div class="card"><h3 style="margin:0 0 8px;font-size:16px">Admin Login</h3><div class="creds"><p><strong>Email:</strong> ${ADMIN_EMAIL}</p><p><strong>Password:</strong> ${ADMIN_PASSWORD}</p></div><p style="margin-top:16px;font-size:14px">Go to <a href="/admin">/admin</a> to access the dashboard.</p></div><div class="warning">⚠️ <strong>Security:</strong> After confirming everything works, remove <code>SETUP_SECRET</code> from Vercel to disable this route.</div></div></body></html>`;

    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return htmlResponse("Setup Failed", msg, 500);
  }
}

function htmlResponse(title: string, message: string, status: number) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:sans-serif;padding:40px"><h1>${title}</h1><p>${message}</p></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
