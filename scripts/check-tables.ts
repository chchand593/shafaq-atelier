import { db } from "../src/lib/db";
async function main() {
  const tables = await db.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'");
  console.log("Tables:", tables);
  for (const t of tables as {name: string}[]) {
    const count = await db.$queryRawUnsafe(`SELECT COUNT(*) as c FROM "${t.name}"`);
    console.log(`  ${t.name}: ${(count as any)[0].c} rows`);
  }
}
main().catch(e => console.error(e)).finally(() => db.$disconnect());
