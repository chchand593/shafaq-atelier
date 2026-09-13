import { db } from "../src/lib/db";
async function main() {
  console.log("Products:", await db.product.count());
  console.log("Active:", await db.product.count({ where: { active: true } }));
  console.log("Orders:", await db.order.count());
  console.log("Users:", await db.user.count());
  const ps = await db.product.findMany({ where: { active: true }, select: { slug: true, name: true, category: true, colors: true, colorImages: true, images: true, image: true, isNewArrival: true, isBestSeller: true, isFeatured: true } });
  for (const p of ps) {
    const colors = JSON.parse(p.colors);
    const ci = JSON.parse(p.colorImages || "[]");
    const imgs = JSON.parse(p.images || "[]");
    console.log(`\n${p.slug} (${p.name})`);
    console.log(`  category: ${p.category}`);
    console.log(`  isNewArrival: ${p.isNewArrival}, isBestSeller: ${p.isBestSeller}, isFeatured: ${p.isFeatured}`);
    console.log(`  main image: ${p.image}`);
    console.log(`  default gallery: ${imgs.length} images`);
    console.log(`  colors: ${JSON.stringify(colors)}`);
    console.log(`  colorImages (${ci.length}):`);
    for (const c of ci) {
      console.log(`    ${c.colorName} (${c.colorHex}): image=${c.image}, images=${JSON.stringify(c.images || [])}`);
    }
    // Check for hex mismatches between colors and colorImages
    const colorHexes = colors.map((c:any) => c.hex.toLowerCase());
    const ciHexes = ci.map((c:any) => c.colorHex.toLowerCase());
    const mismatched = ciHexes.filter((h:string) => !colorHexes.includes(h));
    if (mismatched.length > 0) console.log(`  ⚠ MISMATCH: colorImages has hex not in colors: ${mismatched}`);
    const orphaned = colorHexes.filter((h:string) => !ciHexes.includes(h));
    if (orphaned.length > 0) console.log(`  ⚠ COLORS WITHOUT IMAGES: ${orphaned} (will use fallback)`);
  }
}
main().finally(() => db.$disconnect());
