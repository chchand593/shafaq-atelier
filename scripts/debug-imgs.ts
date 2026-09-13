import { db } from "../src/lib/db";
async function main() {
  const products = await db.product.findMany();
  console.log("Total products:", products.length);
  if (products.length > 0) {
    const p = products[0];
    console.log("First product slug:", p.slug);
    console.log("First product image:", p.image);
    console.log("First product images field:", JSON.stringify(p.images));
    console.log("images type:", typeof p.images);
  }
}
main().finally(() => db.$disconnect());
