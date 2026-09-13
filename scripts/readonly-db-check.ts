import { db } from "../src/lib/db";
async function main() {
  console.log("Products:", await db.product.count());
  console.log("Users:", await db.user.count());
  console.log("Colors:", await db.color.count());
  console.log("Fabrics:", await db.fabric.count());
  console.log("CustomizationOptions:", await db.customizationOption.count());
  console.log("AbayaStyles:", await db.abayaStyle.count());
  console.log("AbayaImages:", await db.abayaImage.count());
}
main().finally(() => db.$disconnect());
