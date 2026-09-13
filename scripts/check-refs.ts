import { db } from "../src/lib/db";
async function main() {
  const ps = await db.product.findMany();
  for (const p of ps) {
    const imgs = JSON.parse(p.images || "[]");
    const ci = JSON.parse(p.colorImages || "[]");
    const allRefs = [p.image, ...imgs, ...ci.map((c:any) => c.image)];
    if (allRefs.some((r:string) => r.includes("daily-1") || r.includes("best-2"))) {
      console.log(`${p.slug}: ${allRefs.filter((r:string) => r.includes("daily-1") || r.includes("best-2")).join(", ")}`);
    }
  }
  // Also check AbayaStyle images
  const styles = await db.abayaStyle.findMany({ include: { images: true } });
  for (const s of styles) {
    const refs = s.images.map(i => i.url);
    if (refs.some(r => r.includes("daily-1") || r.includes("best-2"))) {
      console.log(`AbayaStyle ${s.name}: ${refs.filter(r => r.includes("daily-1") || r.includes("best-2")).join(", ")}`);
    }
  }
}
main().finally(() => db.$disconnect());
