// Seed the Prisma product catalogue from the existing static site-data.
// Run with: bun run db:seed
import { db } from "../src/lib/db";
import { PRODUCTS } from "../src/lib/site-data";

async function main() {
  console.log("Seeding products…");

  for (const p of PRODUCTS) {
    const slug = p.id; // use the stable id as slug
    await db.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        image: p.image,
        colors: JSON.stringify(p.colorOptions),
        sizes: JSON.stringify(p.sizes),
        rating: p.rating,
        reviewCount: p.reviews,
        badge: p.badge ?? null,
        fabric: p.fabric,
        care: p.care,
        description: p.description,
      },
      create: {
        slug,
        name: p.name,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        image: p.image,
        colors: JSON.stringify(p.colorOptions),
        sizes: JSON.stringify(p.sizes),
        rating: p.rating,
        reviewCount: p.reviews,
        badge: p.badge ?? null,
        fabric: p.fabric,
        care: p.care,
        description: p.description,
      },
    });
    console.log(`  ✓ ${p.name}`);
  }

  console.log(`Seeded ${PRODUCTS.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
