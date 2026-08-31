import { db } from "../src/lib/db";
async function main() {
  const products = await db.product.findMany();
  console.log("Products count:", products.length);
  console.log("Active:", products.filter(p => p.active).length);
  console.log("Categories:", products.reduce((acc, p) => { acc[p.category] = (acc[p.category]||0)+1; return acc; }, {}));
  const users = await db.user.findMany();
  console.log("Users count:", users.length);
  console.log("Admin users:", users.filter(u => u.role === 'admin').map(u => u.email).join(','));
  const orders = await db.order.findMany();
  console.log("Orders count:", orders.length);
  const reviews = await db.review.findMany();
  console.log("Reviews count:", reviews.length);
  const settings = await db.storeSettings.findUnique({ where: { id: "default" } });
  console.log("Settings:", settings ? "OK" : "MISSING");
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
