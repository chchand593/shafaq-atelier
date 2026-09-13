import { db } from "../src/lib/db";
async function main() {
  const user = await db.user.findUnique({ where: { email: "admin@shafaqatelier.pk" } });
  if (!user) { console.log("ADMIN USER NOT FOUND"); return; }
  console.log("Email:", user.email);
  console.log("Role:", user.role);
  console.log("Name:", user.name);
  console.log("PasswordHash present:", Boolean(user.passwordHash));
  console.log("PasswordHash length:", user.passwordHash?.length || 0);
  console.log("PasswordHash prefix (first 7 chars — indicates bcrypt):", user.passwordHash?.substring(0, 7) || "none");
  console.log("CreatedAt:", user.createdAt);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
