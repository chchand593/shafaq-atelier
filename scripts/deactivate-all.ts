import { db } from "../src/lib/db";
async function main() { await db.product.updateMany({ where: { active: true }, data: { active: false } }); console.log("All deactivated"); }
main().finally(() => db.$disconnect());
