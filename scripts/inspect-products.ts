import { db } from "../src/lib/db";
async function main() {
  const ps = await db.product.findMany({ select: { slug: true, name: true, image: true, images: true, colorImages: true, colors: true } });
  for (const p of ps) {
    const colors = JSON.parse(p.colors);
    const imgs = JSON.parse(p.images || "[]");
    const ci = JSON.parse(p.colorImages || "[]");
    console.log(`\n${p.slug} (${p.name})`);
    console.log(`  main image: ${p.image}`);
    console.log(`  gallery (${imgs.length}): ${JSON.stringify(imgs)}`);
    console.log(`  colors: ${colors.map((c:any)=>c.name).join(", ")}`);
    console.log(`  colorImages (${ci.length}): ${ci.length > 0 ? ci.map((c:any)=>`${c.colorName}→${c.image}`).join(", ") : "EMPTY"}`);
  }
  console.log(`\nTotal products: ${ps.length}`);
  console.log(`Admin users: ${await db.user.count({ where: { role: "admin" } })}`);
  console.log(`Colors: ${await db.color.count()}`);
  console.log(`Fabrics: ${await db.fabric.count()}`);
  console.log(`Options: ${await db.customizationOption.count()}`);
  console.log(`AbayaStyles: ${await db.abayaStyle.count()}`);
}
main().finally(() => db.$disconnect());
