import { db } from "../src/lib/db";
async function main() {
  const ps = await db.product.findMany({ select: { slug: true, name: true, colors: true, colorImages: true, images: true, image: true } });
  for (const p of ps) {
    const colors = JSON.parse(p.colors);
    const ci = JSON.parse(p.colorImages || "[]");
    const imgs = JSON.parse(p.images || "[]");
    console.log(`\n${p.slug} (${p.name})`);
    console.log(`  main: ${p.image}`);
    console.log(`  colors: ${colors.map((c:any)=>c.name).join(", ")}`);
    console.log(`  colorImages: ${ci.length === 0 ? "EMPTY (fallback)" : ci.map((c:any)=>`${c.colorName}→${c.image}`).join(", ")}`);
    console.log(`  gallery: ${imgs.length} images`);
  }
}
main().finally(() => db.$disconnect());
