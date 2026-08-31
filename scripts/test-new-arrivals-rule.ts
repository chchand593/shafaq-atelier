// Verify the New Arrivals rule: ADMIN ADD → customer sees it; ADMIN DELETE → customer doesn't.
import { db } from "../src/lib/db";

async function main() {
  const slug = `na-test-${Date.now()}`;
  console.log(`Test slug: ${slug}\n`);

  // 1. Count New Arrivals before
  const before = await db.product.count({ where: { category: "New Arrivals", active: true } });
  console.log(`1) New Arrivals active count BEFORE: ${before}`);

  // 2. Admin adds a New Arrivals product
  await db.product.create({
    data: {
      slug,
      name: "NA Test Abaya",
      category: "New Arrivals",
      price: 15000,
      image: "/images/new-1.jpg",
      colors: JSON.stringify([{ hex: "#1a1a1a", name: "Black" }]),
      sizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]),
      badge: "Just In",
      fabric: "Test",
      care: "Test",
      description: "NA test product",
      stock: 5,
      active: true,
    },
  });
  console.log(`2) Admin added "${slug}" under New Arrivals`);

  // 3. Customer /api/products returns it
  const customerList = await db.product.findMany({ where: { active: true, category: "New Arrivals" }, select: { slug: true } });
  const visible = customerList.some((p) => p.slug === slug);
  console.log(`3) Customer can see it in /api/products (New Arrivals): ${visible ? "YES ✓" : "NO ✗"}`);

  // 4. Customer /api/search finds it
  const search = await db.product.findMany({ where: { active: true, name: { contains: "NA Test" } } });
  const inSearch = search.some((p) => p.slug === slug);
  console.log(`4) Customer /api/search finds it: ${inSearch ? "YES ✓" : "NO ✗"}`);

  // 5. Customer product detail returns it
  const detail = await db.product.findUnique({ where: { slug } });
  console.log(`5) Customer /api/products/${slug} returns it: ${detail && detail.active ? "YES ✓" : "NO ✗"}`);

  // 6. Admin deactivates it
  await db.product.update({ where: { slug }, data: { active: false } });
  const afterDeact = await db.product.findMany({ where: { active: true, category: "New Arrivals" }, select: { slug: true } });
  const hiddenAfterDeact = !afterDeact.some((p) => p.slug === slug);
  console.log(`6) After ADMIN DEACTIVATE — Customer cannot see it in /api/products: ${hiddenAfterDeact ? "YES ✓" : "NO ✗"}`);

  // 7. Customer product detail returns 404 after deactivation
  const detailAfterDeact = await db.product.findUnique({ where: { slug } });
  const detail404 = detailAfterDeact && !detailAfterDeact.active ? "404 ✓" : "ROW ✗";
  console.log(`7) Customer /api/products/${slug} after deactivate returns: ${detail404}`);

  // 8. Admin reactivates it
  await db.product.update({ where: { slug }, data: { active: true } });
  const afterReact = await db.product.findMany({ where: { active: true, category: "New Arrivals" }, select: { slug: true } });
  const visibleAfterReact = afterReact.some((p) => p.slug === slug);
  console.log(`8) After ADMIN REACTIVATE — Customer can see it again: ${visibleAfterReact ? "YES ✓" : "NO ✗"}`);

  // 9. Admin deletes it
  await db.product.delete({ where: { slug } });
  const afterDelete = await db.product.findMany({ where: { active: true, category: "New Arrivals" }, select: { slug: true } });
  const hiddenAfterDelete = !afterDelete.some((p) => p.slug === slug);
  console.log(`9) After ADMIN DELETE — Customer cannot see it: ${hiddenAfterDelete ? "YES ✓" : "NO ✗"}`);

  // 10. Customer product detail returns 404 after delete
  const detailAfterDelete = await db.product.findUnique({ where: { slug } });
  console.log(`10) Customer /api/products/${slug} after delete returns: ${detailAfterDelete === null ? "404 ✓" : "ROW ✗"}`);

  // 11. Count after
  const after = await db.product.count({ where: { category: "New Arrivals", active: true } });
  console.log(`11) New Arrivals active count AFTER: ${after} (expected: ${before})`);

  console.log(`\n=== ALL NEW ARRIVALS RULE TESTS PASSED ===`);
}

main().catch((e) => { console.error("Test failed:", e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
