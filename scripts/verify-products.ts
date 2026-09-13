import { db } from "../src/lib/db";
async function main() {
  const products = await db.product.findMany({ orderBy: { createdAt: "asc" }, select: { slug: true, name: true, category: true, price: true, active: true, stock: true, images: true } });
  console.log("=== ALL PRODUCTS ===");
  for (const p of products) {
    console.log(`  ${p.slug} | ${p.name} | ${p.category} | PKR ${p.price} | active=${p.active} | stock=${p.stock} | images=${p.images}`);
  }
  console.log(`\nTotal: ${products.length} products`);
  
  const admin = await db.user.findUnique({ where: { email: "admin@shafaqatelier.pk" }, select: { email: true, role: true, name: true } });
  console.log("\n=== ADMIN USER ===");
  console.log(`  ${admin?.email} | role=${admin?.role} | name=${admin?.name}`);
  
  const orders = await db.order.count();
  const customers = await db.user.count({ where: { role: "customer" } });
  const reviews = await db.review.count();
  const colors = await db.color.count();
  const fabrics = await db.fabric.count();
  const options = await db.customizationOption.count();
  console.log("\n=== OTHER DATA ===");
  console.log(`  Orders: ${orders}`);
  console.log(`  Customers: ${customers}`);
  console.log(`  Reviews: ${reviews}`);
  console.log(`  Colors: ${colors}`);
  console.log(`  Fabrics: ${fabrics}`);
  console.log(`  Customization Options: ${options}`);
  
  const settings = await db.storeSettings.findUnique({ where: { id: "default" } });
  console.log("\n=== STORE SETTINGS ===");
  if (settings) {
    console.log(`  businessName: ${settings.businessName}`);
    console.log(`  customAbayaBasePrice: ${settings.customAbayaBasePrice}`);
    console.log(`  codEnabled: ${settings.codEnabled}`);
    console.log(`  manualTransferEnabled: ${settings.manualTransferEnabled}`);
  } else {
    console.log("  MISSING (will be lazily seeded)");
  }
}
main().finally(() => db.$disconnect());
