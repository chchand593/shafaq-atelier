import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const p = new PrismaClient();

function esc(s: string | null | undefined): string {
  if (s === null || s === undefined) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}
function jval(v: unknown): string { return esc(JSON.stringify(v)); }

(async () => {
  const products = await p.product.findMany({ where: { active: true } });
  const OLD_SLUGS = ["dw-01","dw-02","dw-03","dw-04","na-01","na-02","bs-01","bs-02","royal-pleated-abaya"];

  const lines: string[] = [];
  lines.push("-- ===========================================================================");
  lines.push("-- ShafaQ Atelier V9 Production-Safe SQL");
  lines.push("-- SAFETY: Idempotent (INSERT ON CONFLICT), Non-destructive (NO DROP/TRUNCATE/DELETE)");
  lines.push("-- Only touches Product table. All other tables preserved.");
  lines.push("-- ===========================================================================");
  lines.push("BEGIN;");
  lines.push("");
  lines.push("-- STEP 1: Deactivate 9 known old products (explicit whitelist)");
  lines.push('UPDATE "Product" SET "active" = FALSE, "updatedAt" = NOW() WHERE "slug" IN (' + OLD_SLUGS.map(s => esc(s)).join(", ") + ');');
  lines.push("");
  lines.push("-- STEP 2: Upsert 10 new products");

  for (const prod of products) {
    const id = "prod-" + prod.slug;
    const cols = ["id","slug","name","category","price","originalPrice","image","images","colorImages","colors","sizes","styleOptions","fabricOptions","combinationImages","rating","reviewCount","stock","lowStockThreshold","active","isNewArrival","isBestSeller","isFeatured","badge","fabric","care","description","createdAt","updatedAt"];
    const vals = [
      esc(id), esc(prod.slug), esc(prod.name), esc(prod.category), prod.price,
      prod.originalPrice !== null ? prod.originalPrice : "NULL", esc(prod.image),
      jval(JSON.parse(prod.images)), jval(JSON.parse(prod.colorImages)),
      jval(JSON.parse(prod.colors)), jval(JSON.parse(prod.sizes)),
      jval(JSON.parse(prod.styleOptions)), jval(JSON.parse(prod.fabricOptions)),
      jval(JSON.parse(prod.combinationImages)), prod.rating, prod.reviewCount,
      prod.stock, prod.lowStockThreshold, "TRUE",
      prod.isNewArrival ? "TRUE" : "FALSE", prod.isBestSeller ? "TRUE" : "FALSE", prod.isFeatured ? "TRUE" : "FALSE",
      esc(prod.badge), esc(prod.fabric), esc(prod.care), esc(prod.description), "NOW()", "NOW()"
    ];
    const colList = cols.map(c => '"' + c + '"').join(", ");
    const updateSet = '"name"=EXCLUDED."name","category"=EXCLUDED."category","price"=EXCLUDED."price","originalPrice"=EXCLUDED."originalPrice","image"=EXCLUDED."image","images"=EXCLUDED."images","colorImages"=EXCLUDED."colorImages","colors"=EXCLUDED."colors","sizes"=EXCLUDED."sizes","styleOptions"=EXCLUDED."styleOptions","fabricOptions"=EXCLUDED."fabricOptions","combinationImages"=EXCLUDED."combinationImages","stock"=EXCLUDED."stock","active"=TRUE,"isNewArrival"=EXCLUDED."isNewArrival","isBestSeller"=EXCLUDED."isBestSeller","isFeatured"=EXCLUDED."isFeatured","badge"=EXCLUDED."badge","fabric"=EXCLUDED."fabric","care"=EXCLUDED."care","description"=EXCLUDED."description","updatedAt"=NOW()';
    lines.push('-- ' + prod.name + ' (' + prod.slug + ')');
    lines.push('INSERT INTO "Product" (' + colList + ') VALUES (' + vals.join(", ") + ') ON CONFLICT ("slug") DO UPDATE SET ' + updateSet + ';');
  }

  lines.push("");
  lines.push("-- STEP 3: Verification (read-only)");
  lines.push('SELECT COUNT(*) AS total_products FROM "Product";');
  lines.push('SELECT COUNT(*) AS active_products FROM "Product" WHERE "active" = TRUE;');
  lines.push('SELECT COUNT(*) AS inactive_products FROM "Product" WHERE "active" = FALSE;');
  lines.push("COMMIT;");

  fs.writeFileSync("shafaq-atelier-v9-production-safe.sql", lines.join("\n") + "\n", "utf8");
  console.log("SQL written:", lines.length, "lines");
  await p.$disconnect();
})();
