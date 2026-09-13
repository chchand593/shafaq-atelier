import { db } from "../src/lib/db";
async function main() {
  const ps = await db.product.findMany();
  let found = false;
  for (const p of ps) {
    const imgs = JSON.parse(p.images || "[]");
    const ci = JSON.parse(p.colorImages || "[]");
    const allRefs = [p.image, ...imgs, ...ci.map((c:any) => c.image)];
    const old = allRefs.filter((r:string) => r.includes("daily-1") || r.includes("best-2"));
    if (old.length > 0) { console.log(`  ${p.slug}: ${old.join(", ")}`); found = true; }
  }
  if (!found) console.log("  No DB products reference daily-1.jpg or best-2.jpg");

  // Check AbayaStyle images
  const styles = await db.abayaStyle.findMany({ include: { images: true } });
  let styleFound = false;
  for (const s of styles) {
    const old = s.images.filter(i => i.url.includes("daily-1") || i.url.includes("best-2"));
    if (old.length > 0) { console.log(`  AbayaStyle ${s.name}: ${old.map(i=>i.url).join(", ")}`); styleFound = true; }
  }
  if (!styleFound) console.log("  No AbayaStyles reference daily-1.jpg or best-2.jpg");
}
main().finally(() => db.$disconnect());
