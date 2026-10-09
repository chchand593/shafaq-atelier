// scripts/generate-v9-safe-sql.ts — Generates shafaq-atelier-v9-production-safe.sql
import fs from "fs";
const ALL_SIZES = ["XS","S","M","L","XL","XXL"];
const OLD_PRODUCT_SLUGS = ["dw-01","dw-02","dw-03","dw-04","na-01","na-02","bs-01","bs-02","royal-pleated-abaya"];
const colorNameToFile: Record<string,string> = {
  "#1a1a1a":"black","#6b5246":"mocha","#8a9a7b":"sage","#3a3633":"charcoal","#b87878":"dusty-rose","#1a6b6b":"teal",
  "#2a3441":"navy","#e8dcc4":"cream","#5c1a2b":"burgundy","#1a4d3a":"forest-green","#c9a24b":"gold",
  "#9a7a8a":"mauve","#e8d4a8":"champagne","#6b1f2e":"maroon","#1e6b50":"emerald-green",
  "#d8c7a8":"beige","#6b7a3a":"olive","#a84c2c":"rust","#e8c4c4":"blush-pink","#c4b0d4":"lavender","#a8c4e8":"sky-blue","#722f37":"wine",
};
type P = {slug:string;name:string;category:string;price:number;originalPrice?:number;description:string;fabric:string;care:string;badge?:string;stock:number;isNewArrival:boolean;isBestSeller:boolean;isFeatured:boolean;colors:{hex:string;name:string}[];styles:{id:string;name:string;description:string;additionalPrice:number;active:boolean;sortOrder:number}[];fabrics:{id:string;name:string;description:string;additionalPrice:number;active:boolean;sortOrder:number}[];combos:{colorHex:string;styleId:string;fabricId:string;suffix:string}[]};
// COLLECTION is imported from seed-new-collection.ts data — we'll read it dynamically
import { COLLECTION } from "./seed-new-collection-data";
function sqlStr(s:string|null|undefined){if(s===null||s===undefined)return"NULL";return"'"+s.replace(/'/g,"''")+"'"}
function sqlBool(b:boolean){return b?"TRUE":"FALSE"}
function sqlJson(o:unknown){return sqlStr(JSON.stringify(o))}
const lines:string[]=[];
lines.push("-- ===========================================================================");
lines.push("-- ShafaQ Atelier — V9 Production-Safe SQL");
lines.push("-- ===========================================================================");
lines.push("-- SAFETY: Idempotent (INSERT ON CONFLICT), Non-destructive (NO DROP/TRUNCATE/DELETE)");
lines.push("-- Only touches Product table. All other tables preserved.");
lines.push("-- ===========================================================================");
lines.push("BEGIN;");
lines.push("");
lines.push("-- STEP 1: Deactivate 9 known old products (explicit whitelist)");
const oldSlugsSql = OLD_PRODUCT_SLUGS.map(s=>sqlStr(s)).join(", ");
lines.push(`UPDATE "Product" SET "active" = FALSE, "updatedAt" = NOW() WHERE "slug" IN (${oldSlugsSql});`);
lines.push("");
lines.push("-- STEP 2: Upsert 10 new products");
for(const p of COLLECTION){
  const imgBase=`/images/products/new-collection/${p.slug}`;
  const gi=p.colors.map(c=>`${imgBase}/${colorNameToFile[c.hex]||c.hex.replace("#","")}-1.png`);
  const ci=p.colors.map(c=>({colorHex:c.hex,colorName:c.name,image:`${imgBase}/${colorNameToFile[c.hex]||c.hex.replace("#","")}-1.png`,images:[]}));
  const comb=p.combos.map(c=>({colorHex:c.colorHex,styleId:c.styleId,fabricId:c.fabricId,image:`${imgBase}/${c.suffix}.png`,images:[]}));
  const cj=p.colors.map(c=>({hex:c.hex,name:c.name}));
  lines.push(`INSERT INTO "Product" ("id","slug","name","category","price","originalPrice","image","images","colorImages","colors","sizes","styleOptions","fabricOptions","combinationImages","rating","reviewCount","stock","lowStockThreshold","active","isNewArrival","isBestSeller","isFeatured","badge","fabric","care","description","createdAt","updatedAt") VALUES (${sqlStr("prod-"+p.slug)},${sqlStr(p.slug)},${sqlStr(p.name)},${sqlStr(p.category)},${p.price},${p.originalPrice!==undefined?p.originalPrice:"NULL"},${sqlStr(gi[0])},${sqlJson(gi)},${sqlJson(ci)},${sqlJson(cj)},${sqlJson(ALL_SIZES)},${sqlJson(p.styles)},${sqlJson(p.fabrics)},${sqlJson(comb)},5.0,0,${p.stock},5,TRUE,${sqlBool(p.isNewArrival)},${sqlBool(p.isBestSeller)},${sqlBool(p.isFeatured)},${sqlStr(p.badge??null)},${sqlStr(p.fabric)},${sqlStr(p.care)},${sqlStr(p.description)},NOW(),NOW()) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","category"=EXCLUDED."category","price"=EXCLUDED."price","originalPrice"=EXCLUDED."originalPrice","image"=EXCLUDED."image","images"=EXCLUDED."images","colorImages"=EXCLUDED."colorImages","colors"=EXCLUDED."colors","sizes"=EXCLUDED."sizes","styleOptions"=EXCLUDED."styleOptions","fabricOptions"=EXCLUDED."fabricOptions","combinationImages"=EXCLUDED."combinationImages","stock"=EXCLUDED."stock","active"=TRUE,"isNewArrival"=EXCLUDED."isNewArrival","isBestSeller"=EXCLUDED."isBestSeller","isFeatured"=EXCLUDED."isFeatured","badge"=EXCLUDED."badge","fabric"=EXCLUDED."fabric","care"=EXCLUDED."care","description"=EXCLUDED."description","updatedAt"=NOW();`);
}
lines.push("");
lines.push("-- STEP 3: Verification");
lines.push(`SELECT 'Total products' AS metric, COUNT(*)::text AS value FROM "Product";`);
lines.push(`SELECT 'Active products' AS metric, COUNT(*)::text AS value FROM "Product" WHERE "active" = TRUE;`);
lines.push(`SELECT 'Inactive products' AS metric, COUNT(*)::text AS value FROM "Product" WHERE "active" = FALSE;`);
lines.push("COMMIT;");
fs.writeFileSync("shafaq-atelier-v9-production-safe.sql",lines.join("\n"),"utf8");
console.log("Wrote shafaq-atelier-v9-production-safe.sql");
