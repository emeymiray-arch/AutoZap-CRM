import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@autozap.local" },
    update: {
      name: "Администратор программы",
      role: "ADMIN",
      active: true,
    },
    create: {
      email: "admin@autozap.local",
      name: "Администратор программы",
      role: "ADMIN",
      passwordHash,
    },
  });

  // Удаляем демо-пользователей, если остались
  await prisma.notification.deleteMany({
    where: { user: { email: { in: ["lead@autozap.local", "manager@autozap.local", "os@autozap.local"] } } },
  });
  await prisma.savedFilter.deleteMany({
    where: { user: { email: { in: ["lead@autozap.local", "manager@autozap.local", "os@autozap.local"] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: ["lead@autozap.local", "manager@autozap.local", "os@autozap.local"] } },
  });

  console.log("Seed OK — только администратор программы");
  console.log(`  ${admin.email} / admin123`);
  console.log("Аккаунты менеджеров и руководителей создаёт администратор в Настройках.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
