import { db } from "../src/lib/db";
async function main() {
  console.log("Products:", await db.product.count());
  console.log("Users:", await db.user.count());
  console.log("Admin:", await db.user.count({ where: { role: "admin" } }));
}
main().finally(() => db.$disconnect());
