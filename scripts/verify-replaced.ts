import { db } from "../src/lib/db";
async function main() {
  const ps = await db.product.findMany({ select: { slug: true, name: true, image: true, images: true, colorImages: true } });
  for (const p of ps) {
    const imgs = JSON.parse(p.images || "[]");
    const ci = JSON.parse(p.colorImages || "[]");
    console.log(`\n${p.slug} (${p.name})`);
    console.log(`  main: ${p.image}`);
    console.log(`  gallery: ${imgs.length} images`);
    console.log(`  colorImages: ${ci.length > 0 ? ci.map((c:any)=>`${c.colorName}`).join(", ") : "EMPTY (fallback)"}`);
    // Check if any old images remain
    const allRefs = [p.image, ...imgs, ...ci.map((c:any) => c.image)];
    const oldRefs = allRefs.filter((r:string) => r.includes("daily-1") || r.includes("best-2"));
    if (oldRefs.length > 0) console.log(`  ⚠ OLD IMAGE STILL REFERENCED: ${oldRefs.join(", ")}`);
  }
  console.log(`\nTotal products: ${ps.length}`);
  console.log(`Admin: ${await db.user.count({ where: { role: "admin" } })}`);
  console.log(`Colors: ${await db.color.count()}, Fabrics: ${await db.fabric.count()}, Options: ${await db.customizationOption.count()}`);
}
main().finally(() => db.$disconnect());
