import { db } from "../src/lib/db";
async function main() {
  console.log("Products:", await db.product.count());
  console.log("Active:", await db.product.count({ where: { active: true } }));
  console.log("Users:", await db.user.count());
  console.log("Orders:", await db.order.count());
}
main().finally(() => db.$disconnect());
