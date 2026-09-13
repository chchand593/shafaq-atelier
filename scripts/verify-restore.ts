import { db } from "../src/lib/db";
async function main() {
  const count = await db.product.count();
  console.log("Products after restore:", count);
  const users = await db.user.count();
  console.log("Users:", users);
}
main().finally(() => db.$disconnect());
