import { db } from "../src/lib/db";
async function main() {
  const ps = await db.product.findMany({ select: { slug: true, name: true, colors: true, image: true } });
  for (const p of ps) {
    const colors = JSON.parse(p.colors);
    console.log(`${p.slug} (${p.name}) | image=${p.image} | colors=${colors.map((c:any)=>c.name).join(", ")}`);
  }
}
main().finally(() => db.$disconnect());
