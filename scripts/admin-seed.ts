// Seed a default admin user so the /admin route is accessible.
// Run with: bun run scripts/admin-seed.ts
// Default credentials (CHANGE AFTER FIRST LOGIN):
//   email: admin@shafaqatelier.pk
//   password: Admin@123456
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const email = "admin@shafaqatelier.pk";
  const password = "Admin@123456";
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.upsert({
    where: { email },
    update: { role: "admin", passwordHash },
    create: { email, name: "ShafaQ Admin", role: "admin", passwordHash },
  });
  console.log(`Admin user ready: ${user.email} (role: ${user.role})`);
  console.log("Login with email: admin@shafaqatelier.pk  password: Admin@123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
