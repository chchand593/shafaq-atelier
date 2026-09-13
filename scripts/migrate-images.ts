import { db } from "../src/lib/db";
async function main() {
  const products = await db.product.findMany();
  let migrated = 0;
  for (const p of products) {
    let imgs: string[] = [];
    try { imgs = JSON.parse(p.images); } catch { imgs = []; }
    if (imgs.length === 0 && p.image) {
      await db.product.update({
        where: { id: p.id },
        data: { images: JSON.stringify([p.image]) },
      });
      migrated++;
    }
  }
  console.log(`Migrated ${migrated} products to use images field`);
}
main().finally(() => db.$disconnect());
