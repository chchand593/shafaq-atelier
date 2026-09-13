import { db } from "../src/lib/db";
async function main() {
  const wrap = await db.abayaStyle.findUnique({ where: { slug: "wrap-style" } });
  if (!wrap) { console.log("wrap-style not found"); return; }
  await db.abayaImage.deleteMany({ where: { abayaStyleId: wrap.id } });
  const images = [
    { url: "/images/products/noor-dusty-rose-front.webp", angle: "front", label: "Front View", isPrimary: true, sortOrder: 0 },
    { url: "/images/products/noor-teal-side.webp", angle: "left", label: "Side View", isPrimary: false, sortOrder: 1 },
    { url: "/images/products/noor-peach-front.webp", angle: "detail", label: "Peach Variant", isPrimary: false, sortOrder: 2 },
  ];
  for (const img of images) {
    await db.abayaImage.create({ data: { abayaStyleId: wrap.id, ...img } });
  }
  console.log("✓ AbayaStyle 'Wrap Style' — updated with new photos");
}
main().finally(() => db.$disconnect());
