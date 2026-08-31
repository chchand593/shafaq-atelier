import { db } from "../src/lib/db";
async function main() {
  const products = await db.product.findMany({ select: { id: true, slug: true, name: true } });
  for (const p of products.slice(0, 3)) {
    console.log(`id: ${p.id} | slug: ${p.slug} | name: ${p.name}`);
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
