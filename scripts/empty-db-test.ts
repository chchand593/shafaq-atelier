import { db } from "../src/lib/db";
async function main() {
  // Deactivate ALL products to simulate empty DB
  await db.product.updateMany({ where: { active: true }, data: { active: false } });
  console.log("All products deactivated — simulating empty DB");
  const count = await db.product.count({ where: { active: true } });
  console.log("Active products:", count);
}
main().finally(() => db.$disconnect());
