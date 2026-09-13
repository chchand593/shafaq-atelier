import { db } from "../src/lib/db";
async function main() {
  const colors = await db.color.findMany({
    where: { name: { in: ["Black", "Dusty Rose", "Teal", "Peach", "Charcoal", "Sand", "Mocha"] } },
    select: { name: true, hex: true }
  });
  for (const c of colors) console.log(`${c.name}: ${c.hex}`);
}
main().finally(() => db.$disconnect());
