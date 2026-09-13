import { db } from "../src/lib/db";
import fs from 'fs';
import path from 'path';

async function main() {
  const oldImages = ['daily-1.jpg', 'daily-2.jpg', 'daily-3.jpg', 'daily-4.jpg', 'new-1.jpg', 'new-2.jpg', 'best-1.jpg', 'best-2.jpg', 'custom.jpg', 'hero.jpg'];
  
  // Collect ALL image references from DB
  const ps = await db.product.findMany();
  const styles = await db.abayaStyle.findMany({ include: { images: true } });
  const allDbRefs = new Set<string>();
  for (const p of ps) {
    allDbRefs.add(p.image);
    const imgs = JSON.parse(p.images || "[]");
    const ci = JSON.parse(p.colorImages || "[]");
    imgs.forEach((r:string) => allDbRefs.add(r));
    ci.forEach((c:any) => allDbRefs.add(c.image));
  }
  for (const s of styles) {
    s.images.forEach(i => allDbRefs.add(i.url));
  }

  // Check source code references
  const srcFiles = [
    'src/components/site/lookbook.tsx',
    'src/lib/site-data.ts',
  ];
  const srcContent = srcFiles.map(f => fs.readFileSync(path.join('/home/z/my-project', f), 'utf8')).join('\n');

  for (const img of oldImages) {
    const inDb = Array.from(allDbRefs).some(r => r.includes(img));
    const inSrc = srcContent.includes(img);
    const status = (inDb || inSrc) ? "REFERENCED (keep)" : "UNREFERENCED (safe to remove)";
    console.log(`  ${img}: ${status}${inDb ? " [DB]" : ""}${inSrc ? " [SRC]" : ""}`);
  }
}
main().finally(() => db.$disconnect());
