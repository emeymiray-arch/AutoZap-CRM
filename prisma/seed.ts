import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@autozap.local" },
    update: {},
    create: {
      email: "admin@autozap.local",
      name: "Администратор",
      role: "ADMIN",
      passwordHash,
    },
  });

  const lead = await prisma.user.upsert({
    where: { email: "lead@autozap.local" },
    update: {},
    create: {
      email: "lead@autozap.local",
      name: "Джамиля",
      role: "MANAGER_LEAD",
      passwordHash,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@autozap.local" },
    update: {},
    create: {
      email: "manager@autozap.local",
      name: "Иван",
      role: "MANAGER",
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "os@autozap.local" },
    update: {},
    create: {
      email: "os@autozap.local",
      name: "Менеджер ОС",
      role: "OS_MANAGER",
      passwordHash,
    },
  });

  const company = await prisma.company.create({
    data: {
      name: "АвтоДеталь Плюс",
      legalForm: "ООО",
      inn: "7701234567",
      city: "Москва",
      region: "Москва",
      phone: "+7 495 111-22-33",
      email: "info@autodetal.example",
      website: "https://autodetal.example",
      companyType: "Опт",
      skuCount: 1200,
      categories: "Автозапчасти",
      responsibleId: manager.id,
      createdById: admin.id,
      notes: "Пилотный партнёр",
    },
  });

  const contact = await prisma.contact.create({
    data: {
      firstName: "Алексей",
      lastName: "Смирнов",
      position: "Директор",
      phone: "+7 916 000-11-22",
      email: "a.smirnov@autodetal.example",
      telegram: "@asmirnov",
      companyId: company.id,
      responsibleId: manager.id,
      createdById: admin.id,
    },
  });

  const lead1 = await prisma.lead.create({
    data: {
      title: "АвтоДеталь Плюс — подключение",
      companyId: company.id,
      contactId: contact.id,
      phone: contact.phone,
      email: contact.email,
      city: "Москва",
      region: "Москва",
      source: "Сайт",
      businessType: "Опт",
      assortment: "Запчасти легковые",
      responsibleId: manager.id,
      status: "PROPOSAL_SENT",
      comment: "Интересует быстрый запуск магазина",
      createdById: admin.id,
      nextContactAt: new Date(),
    },
  });

  await prisma.deal.create({
    data: {
      title: "Сделка: АвтоДеталь Плюс",
      companyId: company.id,
      contactId: contact.id,
      leadId: lead1.id,
      responsibleId: manager.id,
      stage: "PROPOSAL",
      source: "Сайт",
      amount: 50000,
      nextStep: "Созвон по КП",
      deadline: new Date(Date.now() + 3 * 86400000),
      createdById: admin.id,
    },
  });

  await prisma.lead.create({
    data: {
      title: "Новый лид — Казань Авто",
      phone: "+7 843 222-33-44",
      city: "Казань",
      region: "Татарстан",
      source: "Avito",
      responsibleId: lead.id,
      status: "NEW",
      createdById: admin.id,
    },
  });

  const partner = await prisma.partner.create({
    data: {
      name: "АвтоДеталь Плюс",
      companyId: company.id,
      responsibleId: manager.id,
      status: "WAITING_CATALOG",
      region: "Москва",
      registeredAt: new Date(),
      nextContactAt: new Date(),
      createdById: admin.id,
    },
  });

  await prisma.catalog.create({
    data: {
      name: "Каталог АвтоДеталь v1",
      partnerId: partner.id,
      companyId: company.id,
      status: "EXPECTED",
      responsibleId: manager.id,
      createdById: admin.id,
    },
  });

  await prisma.store.create({
    data: {
      name: "Магазин АвтоДеталь Москва",
      companyId: company.id,
      partnerId: partner.id,
      region: "Москва",
      status: "CREATING",
      responsibleId: manager.id,
      registeredAt: new Date(),
      createdById: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Получить каталог",
      description: "Связаться с партнёром и запросить Excel",
      responsibleId: manager.id,
      creatorId: admin.id,
      companyId: company.id,
      partnerId: partner.id,
      deadline: new Date(Date.now() - 86400000),
      priority: "HIGH",
      status: "IN_PROGRESS",
    },
  });

  await prisma.activity.create({
    data: {
      type: "CALL",
      authorId: manager.id,
      comment: "Дозвонились, отправили КП",
      companyId: company.id,
      leadId: lead1.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: manager.id,
      title: "Добро пожаловать в AutoZap OS",
      body: "Система готова к работе",
      link: "/dashboard",
    },
  });

  await prisma.savedFilter.createMany({
    data: [
      {
        userId: manager.id,
        name: "Мои лиды",
        entityType: "leads",
        query: `responsibleId=${manager.id}`,
      },
      {
        userId: manager.id,
        name: "Ожидаем каталог",
        entityType: "partners",
        query: "status=WAITING_CATALOG",
      },
      {
        userId: manager.id,
        name: "Просроченные задачи",
        entityType: "tasks",
        query: "deadline=overdue",
      },
    ],
  });

  console.log("Seed OK");
  console.log("Users:");
  console.log("  admin@autozap.local / admin123");
  console.log("  lead@autozap.local / admin123");
  console.log("  manager@autozap.local / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
