"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeAudit, logActivity } from "@/lib/audit";
import {
  archiveEntity,
  restoreEntity,
  hardDeleteEntity,
  changeStatus,
  trackFieldChanges,
} from "@/lib/entity-actions";
import { findCompanyDuplicates, findContactDuplicates } from "@/lib/dedup";
import { processOverdueTasks } from "@/lib/automations";
import { canManageUsers, isSelectableRole } from "@/lib/permissions";
import { citiesFromForm } from "@/lib/geo";

function str(form: FormData, key: string) {
  const v = form.get(key);
  return v == null || v === "" ? null : String(v);
}

function num(form: FormData, key: string) {
  const v = str(form, key);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function date(form: FormData, key: string) {
  const v = str(form, key);
  return v ? new Date(v) : null;
}

function revalidateEntity(paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

/** Находит компанию по имени или создаёт новую (для форм лида/сделки/партнёра и т.д.) */
async function resolveCompanyId(
  formData: FormData,
  user: { id: string },
  fallbackName?: string | null,
): Promise<string | null> {
  const fromId = str(formData, "companyId");
  if (fromId) return fromId;

  const name = (str(formData, "companyName") || fallbackName || "").trim();
  if (!name) return null;

  const found = await prisma.company.findFirst({
    where: { archivedAt: null, name: { equals: name, mode: "insensitive" } },
  });
  if (found) return found.id;

  const company = await prisma.company.create({
    data: {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      city: str(formData, "city"),
      region: str(formData, "region"),
      warehouseCities: citiesFromForm(formData, "warehouseCities"),
      productionCities: citiesFromForm(formData, "productionCities"),
      website: str(formData, "website"),
      responsibleId: str(formData, "responsibleId") || user.id,
      createdById: user.id,
    },
  });
  await writeAudit({
    userId: user.id,
    entityType: "company",
    entityId: company.id,
    action: "create",
    newValue: { id: company.id, name: company.name },
    summary: `Компания «${company.name}» создана автоматически`,
  });
  revalidateEntity(["/crm/companies"]);
  return company.id;
}

// ─── Companies ─────────────────────────────────────────────

export async function createCompanyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const force = str(formData, "forceCreate") === "1";
  const data = {
    name: str(formData, "name") || "",
    legalForm: str(formData, "legalForm"),
    inn: str(formData, "inn"),
    city: str(formData, "city"),
    region: str(formData, "region"),
    warehouseCities: citiesFromForm(formData, "warehouseCities"),
    productionCities: citiesFromForm(formData, "productionCities"),
    address: str(formData, "address"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    website: str(formData, "website"),
    companyType: str(formData, "companyType"),
    skuCount: num(formData, "skuCount"),
    categories: str(formData, "categories"),
    notes: str(formData, "notes"),
    responsibleId: str(formData, "responsibleId") || user.id,
    nextContactAt: date(formData, "nextContactAt"),
    createdById: user.id,
  };
  if (!data.name) throw new Error("Название обязательно");

  if (!force) {
    const dups = await findCompanyDuplicates(data);
    if (dups.length) {
      const ids = dups.map((d) => d.id).join(",");
      redirect(`/crm/companies/new?duplicateOf=${ids}&name=${encodeURIComponent(data.name)}`);
    }
  }

  const company = await prisma.company.create({ data });
  await writeAudit({
    userId: user.id,
    entityType: "company",
    entityId: company.id,
    action: "create",
    newValue: company,
    summary: `${user.name} добавил(а) компанию`,
  });
  await logActivity({
    type: "CREATE",
    authorId: user.id,
    comment: `Создана компания ${company.name}`,
    companyId: company.id,
  });
  revalidateEntity(["/crm/companies", "/dashboard"]);
  redirect(`/crm/companies/${company.id}`);
}

export async function updateCompanyAction(id: string, formData: FormData) {
  const user = await requireUser();
  const before = await prisma.company.findUniqueOrThrow({ where: { id } });
  const data = {
    name: str(formData, "name") || before.name,
    legalForm: str(formData, "legalForm"),
    inn: str(formData, "inn"),
    city: str(formData, "city"),
    region: str(formData, "region"),
    warehouseCities: citiesFromForm(formData, "warehouseCities"),
    productionCities: citiesFromForm(formData, "productionCities"),
    address: str(formData, "address"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    website: str(formData, "website"),
    companyType: str(formData, "companyType"),
    skuCount: num(formData, "skuCount"),
    categories: str(formData, "categories"),
    notes: str(formData, "notes"),
    status: str(formData, "status") || before.status,
    responsibleId: str(formData, "responsibleId") || before.responsibleId,
    nextContactAt: date(formData, "nextContactAt"),
    lastContactAt: date(formData, "lastContactAt"),
  };
  const after = await prisma.company.update({ where: { id }, data });
  await trackFieldChanges("company", id, user, before as never, after as never);
  await logActivity({
    type: "UPDATE",
    authorId: user.id,
    comment: "Компания обновлена",
    companyId: id,
  });
  revalidateEntity([`/crm/companies/${id}`, "/crm/companies"]);
  redirect(`/crm/companies/${id}`);
}

// ─── Contacts ──────────────────────────────────────────────

export async function createContactAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const force = str(formData, "forceCreate") === "1";
  const companyId = await resolveCompanyId(formData, user);
  const data = {
    firstName: str(formData, "firstName") || "",
    lastName: str(formData, "lastName"),
    position: str(formData, "position"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    telegram: str(formData, "telegram"),
    whatsapp: str(formData, "whatsapp"),
    companyId,
    responsibleId: str(formData, "responsibleId") || user.id,
    comment: str(formData, "comment"),
    createdById: user.id,
  };
  if (!data.firstName) throw new Error("Имя обязательно");

  if (!force) {
    const dups = await findContactDuplicates(data);
    if (dups.length) {
      const ids = dups.map((d) => d.id).join(",");
      redirect(`/crm/contacts/new?duplicateOf=${ids}`);
    }
  }

  const contact = await prisma.contact.create({ data });
  await writeAudit({
    userId: user.id,
    entityType: "contact",
    entityId: contact.id,
    action: "create",
    newValue: contact,
    summary: `${user.name} добавил(а) контакт`,
  });
  await logActivity({
    type: "CREATE",
    authorId: user.id,
    comment: `Создан контакт ${contact.firstName}`,
    companyId: contact.companyId,
    contactId: contact.id,
  });
  revalidateEntity(["/crm/contacts", "/dashboard"]);
  redirect(`/crm/contacts/${contact.id}`);
}

export async function updateContactAction(id: string, formData: FormData) {
  const user = await requireUser();
  const before = await prisma.contact.findUniqueOrThrow({ where: { id } });
  const data = {
    firstName: str(formData, "firstName") || before.firstName,
    lastName: str(formData, "lastName"),
    position: str(formData, "position"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    telegram: str(formData, "telegram"),
    whatsapp: str(formData, "whatsapp"),
    companyId: str(formData, "companyId"),
    responsibleId: str(formData, "responsibleId") || before.responsibleId,
    comment: str(formData, "comment"),
  };
  const after = await prisma.contact.update({ where: { id }, data });
  await trackFieldChanges("contact", id, user, before as never, after as never);
  revalidateEntity([`/crm/contacts/${id}`, "/crm/contacts"]);
  redirect(`/crm/contacts/${id}`);
}

// ─── Leads ─────────────────────────────────────────────────

export async function createLeadAction(formData: FormData) {
  const user = await requireUser();
  const companyId = await resolveCompanyId(formData, user);
  const data = {
    title: str(formData, "title") || "",
    companyId,
    contactId: str(formData, "contactId"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    city: str(formData, "city"),
    region: str(formData, "region"),
    source: str(formData, "source"),
    website: str(formData, "website"),
    avito: str(formData, "avito"),
    wildberries: str(formData, "wildberries"),
    ozon: str(formData, "ozon"),
    businessType: str(formData, "businessType"),
    assortment: str(formData, "assortment"),
    responsibleId: str(formData, "responsibleId") || user.id,
    status: (str(formData, "status") || "NEW") as never,
    nextContactAt: date(formData, "nextContactAt"),
    comment: str(formData, "comment"),
    createdById: user.id,
  };
  if (!data.title) throw new Error("Название обязательно");

  const lead = await prisma.lead.create({ data });
  await writeAudit({
    userId: user.id,
    entityType: "lead",
    entityId: lead.id,
    action: "create",
    newValue: lead,
    summary: `${user.name} создал(а) лид`,
  });
  await logActivity({
    type: "CREATE",
    authorId: user.id,
    comment: `Создан лид ${lead.title}`,
    companyId: lead.companyId,
    leadId: lead.id,
  });
  revalidateEntity(["/crm/leads", "/dashboard", "/funnel"]);
  redirect(`/crm/leads/${lead.id}`);
}

export async function updateLeadAction(id: string, formData: FormData) {
  const user = await requireUser();
  const before = await prisma.lead.findUniqueOrThrow({ where: { id } });
  const newStatus = str(formData, "status") || before.status;
  const data = {
    title: str(formData, "title") || before.title,
    companyId: str(formData, "companyId"),
    contactId: str(formData, "contactId"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    city: str(formData, "city"),
    region: str(formData, "region"),
    source: str(formData, "source"),
    website: str(formData, "website"),
    avito: str(formData, "avito"),
    wildberries: str(formData, "wildberries"),
    ozon: str(formData, "ozon"),
    businessType: str(formData, "businessType"),
    assortment: str(formData, "assortment"),
    responsibleId: str(formData, "responsibleId") || before.responsibleId,
    status: newStatus as never,
    nextContactAt: date(formData, "nextContactAt"),
    lastContactAt: date(formData, "lastContactAt"),
    comment: str(formData, "comment"),
    rejectReason: str(formData, "rejectReason"),
  };
  const after = await prisma.lead.update({ where: { id }, data });
  await trackFieldChanges("lead", id, user, before as never, after as never);
  if (before.status !== newStatus) {
    await changeStatus({
      entity: "lead",
      id,
      newStatus,
      user,
      rejectReason: data.rejectReason || undefined,
    });
  }
  revalidateEntity([`/crm/leads/${id}`, "/crm/leads", "/dashboard", "/funnel"]);
  redirect(`/crm/leads/${id}`);
}

export async function convertLeadAction(leadId: string) {
  const user = await requireUser();
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  if (lead.archivedAt) throw new Error("Лид в архиве");

  let companyId = lead.companyId;
  if (!companyId) {
    const company = await prisma.company.create({
      data: {
        name: lead.title,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        region: lead.region,
        website: lead.website,
        responsibleId: lead.responsibleId || user.id,
        createdById: user.id,
      },
    });
    companyId = company.id;
  }

  const partner = await prisma.partner.create({
    data: {
      name: lead.title,
      companyId,
      leadId: lead.id,
      responsibleId: lead.responsibleId || user.id,
      status: "REGISTRATION",
      region: lead.region,
      registeredAt: new Date(),
      createdById: user.id,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { companyId, convertedPartnerId: partner.id },
  });

  await changeStatus({
    entity: "lead",
    id: leadId,
    newStatus: "CONVERTED",
    user,
  });

  const deal = await prisma.deal.create({
    data: {
      title: `Сделка: ${lead.title}`,
      companyId,
      contactId: lead.contactId,
      leadId: lead.id,
      responsibleId: lead.responsibleId || user.id,
      stage: "REGISTRATION",
      source: lead.source,
      createdById: user.id,
    },
  });

  await writeAudit({
    userId: user.id,
    entityType: "lead",
    entityId: leadId,
    action: "convert",
    newValue: { partnerId: partner.id, dealId: deal.id },
    summary: `${user.name} конвертировал(а) лид в партнёра`,
  });
  await logActivity({
    type: "CONVERT",
    authorId: user.id,
    comment: `Лид конвертирован → партнёр`,
    companyId,
    leadId,
    partnerId: partner.id,
  });

  revalidateEntity(["/crm/leads", "/partners", "/crm/deals", "/dashboard"]);
  redirect(`/partners/${partner.id}`);
}

// ─── Deals ─────────────────────────────────────────────────

export async function createDealAction(formData: FormData) {
  const user = await requireUser();
  const companyId = await resolveCompanyId(formData, user);
  const data = {
    title: str(formData, "title") || "",
    companyId,
    contactId: str(formData, "contactId"),
    leadId: str(formData, "leadId"),
    responsibleId: str(formData, "responsibleId") || user.id,
    stage: (str(formData, "stage") || "NEW") as never,
    source: str(formData, "source"),
    amount: num(formData, "amount"),
    nextStep: str(formData, "nextStep"),
    deadline: date(formData, "deadline"),
    comment: str(formData, "comment"),
    createdById: user.id,
  };
  if (!data.title) throw new Error("Название обязательно");
  const deal = await prisma.deal.create({ data });
  await writeAudit({
    userId: user.id,
    entityType: "deal",
    entityId: deal.id,
    action: "create",
    newValue: deal,
    summary: `${user.name} создал(а) сделку`,
  });
  await logActivity({
    type: "CREATE",
    authorId: user.id,
    comment: `Создана сделка ${deal.title}`,
    companyId: deal.companyId,
    dealId: deal.id,
  });
  revalidateEntity(["/crm/deals", "/funnel", "/dashboard"]);
  redirect(`/crm/deals/${deal.id}`);
}

export async function updateDealAction(id: string, formData: FormData) {
  const user = await requireUser();
  const before = await prisma.deal.findUniqueOrThrow({ where: { id } });
  const newStage = str(formData, "stage") || before.stage;
  const data = {
    title: str(formData, "title") || before.title,
    companyId: str(formData, "companyId"),
    contactId: str(formData, "contactId"),
    leadId: str(formData, "leadId"),
    responsibleId: str(formData, "responsibleId") || before.responsibleId,
    stage: newStage as never,
    source: str(formData, "source"),
    amount: num(formData, "amount"),
    nextStep: str(formData, "nextStep"),
    deadline: date(formData, "deadline"),
    comment: str(formData, "comment"),
  };
  const after = await prisma.deal.update({ where: { id }, data });
  await trackFieldChanges("deal", id, user, before as never, after as never);
  if (before.stage !== newStage) {
    await changeStatus({ entity: "deal", id, newStatus: newStage, user });
  }
  revalidateEntity([`/crm/deals/${id}`, "/crm/deals", "/funnel"]);
  redirect(`/crm/deals/${id}`);
}

export async function moveDealStageAction(dealId: string, stage: string) {
  const user = await requireUser();
  await changeStatus({ entity: "deal", id: dealId, newStatus: stage, user });
  revalidateEntity(["/funnel", "/crm/deals", `/crm/deals/${dealId}`, "/dashboard"]);
  return { ok: true };
}

// ─── Partners / Catalogs / Stores ──────────────────────────

export async function createPartnerAction(formData: FormData) {
  const user = await requireUser();
  const partnerName = str(formData, "name") || "";
  const companyId = await resolveCompanyId(formData, user, partnerName);
  const data = {
    name: partnerName,
    companyId,
    responsibleId: str(formData, "responsibleId") || user.id,
    status: (str(formData, "status") || "NEW") as never,
    region: str(formData, "region"),
    comment: str(formData, "comment"),
    nextContactAt: date(formData, "nextContactAt"),
    createdById: user.id,
  };
  if (!data.name) throw new Error("Название обязательно");
  const partner = await prisma.partner.create({ data });
  await writeAudit({
    userId: user.id,
    entityType: "partner",
    entityId: partner.id,
    action: "create",
    newValue: partner,
    summary: `${user.name} создал(а) партнёра`,
  });
  await logActivity({
    type: "CREATE",
    authorId: user.id,
    comment: `Создан партнёр ${partner.name}`,
    companyId: partner.companyId,
    partnerId: partner.id,
  });
  revalidateEntity(["/partners", "/dashboard"]);
  redirect(`/partners/${partner.id}`);
}

export async function updatePartnerAction(id: string, formData: FormData) {
  const user = await requireUser();
  const before = await prisma.partner.findUniqueOrThrow({ where: { id } });
  const newStatus = str(formData, "status") || before.status;
  const data = {
    name: str(formData, "name") || before.name,
    companyId: str(formData, "companyId"),
    responsibleId: str(formData, "responsibleId") || before.responsibleId,
    status: newStatus as never,
    region: str(formData, "region"),
    comment: str(formData, "comment"),
    nextContactAt: date(formData, "nextContactAt"),
    lastContactAt: date(formData, "lastContactAt"),
  };
  const after = await prisma.partner.update({ where: { id }, data });
  await trackFieldChanges("partner", id, user, before as never, after as never);
  if (before.status !== newStatus) {
    await changeStatus({ entity: "partner", id, newStatus, user });
  }
  revalidateEntity([`/partners/${id}`, "/partners", "/dashboard"]);
  redirect(`/partners/${id}`);
}

export async function createCatalogAction(formData: FormData) {
  const user = await requireUser();
  const data = {
    name: str(formData, "name") || "",
    partnerId: str(formData, "partnerId"),
    companyId: str(formData, "companyId"),
    status: (str(formData, "status") || "EXPECTED") as never,
    skuCount: num(formData, "skuCount"),
    receivedAt: date(formData, "receivedAt"),
    responsibleId: str(formData, "responsibleId") || user.id,
    comment: str(formData, "comment"),
    createdById: user.id,
  };
  if (!data.name) throw new Error("Название обязательно");
  const catalog = await prisma.catalog.create({ data });
  await writeAudit({
    userId: user.id,
    entityType: "catalog",
    entityId: catalog.id,
    action: "create",
    newValue: catalog,
    summary: `${user.name} добавил(а) каталог`,
  });
  await logActivity({
    type: "CREATE",
    authorId: user.id,
    comment: `Создан каталог ${catalog.name}`,
    companyId: catalog.companyId,
    partnerId: catalog.partnerId,
    catalogId: catalog.id,
  });
  if (catalog.status === "RECEIVED") {
    await changeStatus({ entity: "catalog", id: catalog.id, newStatus: "RECEIVED", user });
  }
  revalidateEntity(["/catalogs", "/partners", "/dashboard"]);
  redirect(`/catalogs/${catalog.id}`);
}

export async function updateCatalogAction(id: string, formData: FormData) {
  const user = await requireUser();
  const before = await prisma.catalog.findUniqueOrThrow({ where: { id } });
  const newStatus = str(formData, "status") || before.status;
  const data = {
    name: str(formData, "name") || before.name,
    partnerId: str(formData, "partnerId"),
    companyId: str(formData, "companyId"),
    status: newStatus as never,
    skuCount: num(formData, "skuCount"),
    receivedAt: date(formData, "receivedAt"),
    responsibleId: str(formData, "responsibleId") || before.responsibleId,
    comment: str(formData, "comment"),
  };
  const after = await prisma.catalog.update({ where: { id }, data });
  await trackFieldChanges("catalog", id, user, before as never, after as never);
  if (before.status !== newStatus) {
    await changeStatus({ entity: "catalog", id, newStatus, user });
  }
  revalidateEntity([`/catalogs/${id}`, "/catalogs", "/dashboard"]);
  redirect(`/catalogs/${id}`);
}

export async function createStoreAction(formData: FormData) {
  const user = await requireUser();
  const companyId = await resolveCompanyId(formData, user);
  const data = {
    name: str(formData, "name") || "",
    companyId,
    partnerId: str(formData, "partnerId"),
    region: str(formData, "region"),
    status: (str(formData, "status") || "CREATING") as never,
    productCount: num(formData, "productCount"),
    responsibleId: str(formData, "responsibleId") || user.id,
    storeUrl: str(formData, "storeUrl"),
    comment: str(formData, "comment"),
    registeredAt: date(formData, "registeredAt") || new Date(),
    createdById: user.id,
  };
  if (!data.name) throw new Error("Название обязательно");
  const store = await prisma.store.create({ data });
  await writeAudit({
    userId: user.id,
    entityType: "store",
    entityId: store.id,
    action: "create",
    newValue: store,
    summary: `${user.name} создал(а) магазин`,
  });
  await logActivity({
    type: "CREATE",
    authorId: user.id,
    comment: `Создан магазин ${store.name}`,
    companyId: store.companyId,
    partnerId: store.partnerId,
    storeId: store.id,
  });
  revalidateEntity(["/stores", "/dashboard"]);
  redirect(`/stores/${store.id}`);
}

export async function updateStoreAction(id: string, formData: FormData) {
  const user = await requireUser();
  const before = await prisma.store.findUniqueOrThrow({ where: { id } });
  const newStatus = str(formData, "status") || before.status;
  const data = {
    name: str(formData, "name") || before.name,
    companyId: str(formData, "companyId"),
    partnerId: str(formData, "partnerId"),
    region: str(formData, "region"),
    status: newStatus as never,
    productCount: num(formData, "productCount"),
    responsibleId: str(formData, "responsibleId") || before.responsibleId,
    storeUrl: str(formData, "storeUrl"),
    comment: str(formData, "comment"),
    publishedAt:
      newStatus === "PUBLISHED" && !before.publishedAt ? new Date() : before.publishedAt,
    activatedAt:
      newStatus === "ACTIVE" && !before.activatedAt ? new Date() : before.activatedAt,
  };
  const after = await prisma.store.update({ where: { id }, data });
  await trackFieldChanges("store", id, user, before as never, after as never);
  if (before.status !== newStatus) {
    await changeStatus({ entity: "store", id, newStatus, user });
  }
  revalidateEntity([`/stores/${id}`, "/stores", "/dashboard"]);
  redirect(`/stores/${id}`);
}

// ─── Tasks / Activities ─────────────────────────────────────

export async function createTaskAction(formData: FormData) {
  const user = await requireUser();
  const companyId = await resolveCompanyId(formData, user);
  const data = {
    title: str(formData, "title") || "",
    description: str(formData, "description"),
    responsibleId: str(formData, "responsibleId") || user.id,
    creatorId: user.id,
    companyId,
    contactId: str(formData, "contactId"),
    leadId: str(formData, "leadId"),
    dealId: str(formData, "dealId"),
    partnerId: str(formData, "partnerId"),
    deadline: date(formData, "deadline"),
    priority: (str(formData, "priority") || "MEDIUM") as never,
    status: (str(formData, "status") || "NEW") as never,
  };
  if (!data.title) throw new Error("Название обязательно");
  const task = await prisma.task.create({ data });
  await writeAudit({
    userId: user.id,
    entityType: "task",
    entityId: task.id,
    action: "create",
    newValue: task,
    summary: `${user.name} создал(а) задачу`,
  });
  await logActivity({
    type: "TASK_CREATED",
    authorId: user.id,
    comment: `Создана задача ${task.title}`,
    companyId: task.companyId,
    leadId: task.leadId,
    dealId: task.dealId,
    partnerId: task.partnerId,
    taskId: task.id,
  });
  if (task.responsibleId) {
    await prisma.notification.create({
      data: {
        userId: task.responsibleId,
        title: "Новая задача",
        body: task.title,
        link: `/tasks/${task.id}`,
      },
    });
  }
  revalidateEntity(["/tasks", "/dashboard"]);
  redirect(`/tasks/${task.id}`);
}

export async function updateTaskAction(id: string, formData: FormData) {
  const user = await requireUser();
  const before = await prisma.task.findUniqueOrThrow({ where: { id } });
  const newStatus = str(formData, "status") || before.status;
  const data = {
    title: str(formData, "title") || before.title,
    description: str(formData, "description"),
    responsibleId: str(formData, "responsibleId") || before.responsibleId,
    companyId: str(formData, "companyId"),
    contactId: str(formData, "contactId"),
    leadId: str(formData, "leadId"),
    dealId: str(formData, "dealId"),
    partnerId: str(formData, "partnerId"),
    deadline: date(formData, "deadline"),
    priority: (str(formData, "priority") || before.priority) as never,
    status: newStatus as never,
  };
  const after = await prisma.task.update({ where: { id }, data });
  await trackFieldChanges("task", id, user, before as never, after as never);
  if (before.status !== newStatus && newStatus === "DONE") {
    await logActivity({
      type: "TASK_DONE",
      authorId: user.id,
      comment: `Задача выполнена`,
      taskId: id,
    });
  }
  revalidateEntity([`/tasks/${id}`, "/tasks", "/dashboard"]);
  redirect(`/tasks/${id}`);
}

export async function createActivityAction(formData: FormData) {
  const user = await requireUser();
  const type = (str(formData, "type") || "COMMENT") as never;
  const activity = await prisma.activity.create({
    data: {
      type,
      authorId: user.id,
      comment: str(formData, "comment") || "",
      companyId: str(formData, "companyId"),
      contactId: str(formData, "contactId"),
      leadId: str(formData, "leadId"),
      dealId: str(formData, "dealId"),
      partnerId: str(formData, "partnerId"),
      catalogId: str(formData, "catalogId"),
      storeId: str(formData, "storeId"),
      taskId: str(formData, "taskId"),
    },
  });

  const entityId =
    activity.leadId ||
    activity.dealId ||
    activity.partnerId ||
    activity.companyId ||
    activity.taskId;
  if (entityId) {
    await writeAudit({
      userId: user.id,
      entityType: "activity",
      entityId: activity.id,
      action: "create",
      summary: `${user.name} добавил(а) активность: ${type}`,
    });
  }

  const redirectTo = str(formData, "redirectTo") || "/activities";
  revalidateEntity(["/activities", "/dashboard", redirectTo]);
  redirect(redirectTo);
}

// ─── Archive / Restore / Delete ────────────────────────────

export async function archiveAction(entity: string, id: string, redirectTo: string) {
  const user = await requireUser();
  await archiveEntity(entity as never, id, user);
  revalidateEntity([redirectTo, "/archive", "/dashboard"]);
  redirect("/archive");
}

export async function restoreAction(entity: string, id: string, redirectTo: string) {
  const user = await requireUser();
  await restoreEntity(entity as never, id, user);
  revalidateEntity([redirectTo, "/archive", "/dashboard"]);
  redirect(redirectTo);
}

export async function hardDeleteAction(entity: string, id: string) {
  const user = await requireUser();
  await hardDeleteEntity(entity as never, id, user);
  revalidateEntity(["/archive"]);
  redirect("/archive");
}

export async function changeStatusAction(entity: string, id: string, newStatus: string) {
  const user = await requireUser();
  await changeStatus({ entity: entity as never, id, newStatus, user });
  revalidateEntity(["/dashboard", "/funnel"]);
  return { ok: true };
}

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidateEntity(["/dashboard"]);
}

export async function refreshOverdueAction() {
  await requireUser();
  const n = await processOverdueTasks();
  revalidateEntity(["/tasks", "/dashboard"]);
  return { count: n };
}

export async function saveFilterAction(formData: FormData) {
  const user = await requireUser();
  const name = str(formData, "name");
  const entityType = str(formData, "entityType");
  const query = str(formData, "query");
  if (!name || !entityType || !query) throw new Error("Заполните фильтр");
  await prisma.savedFilter.create({
    data: { userId: user.id, name, entityType, query },
  });
  revalidateEntity([`/crm/${entityType}`, `/${entityType}`]);
}

// ─── Users / registration ──────────────────────────────────

async function createUserFromForm(formData: FormData) {
  const name = (str(formData, "name") || "").trim();
  const email = (str(formData, "email") || "").toLowerCase().trim();
  const password = str(formData, "password") || "";
  const roleRaw = str(formData, "role") || "MANAGER";

  if (!name) throw new Error("Укажите имя — оно появится в списке ответственных");
  if (!email || !email.includes("@")) throw new Error("Укажите корректный email");
  if (password.length < 6) throw new Error("Пароль не короче 6 символов");
  if (!isSelectableRole(roleRaw)) throw new Error("Выберите роль: Менеджер или Руководитель");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Пользователь с таким email уже есть");

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      adminPassword: password,
      role: roleRaw,
      active: true,
    },
  });
}

/** Публичная регистрация отключена */
export async function registerAction(): Promise<void> {
  redirect("/login");
}

/** Администратор программы создаёт аккаунт менеджеру или руководителю */
export async function createTeamUserAction(formData: FormData): Promise<void> {
  const actor = await requireUser();
  if (!canManageUsers(actor.role)) {
    throw new Error("Только администратор программы может создавать аккаунты");
  }
  const created = await createUserFromForm(formData);
  await writeAudit({
    userId: actor.id,
    entityType: "user",
    entityId: created.id,
    action: "create",
    summary: `${actor.name} создал(а) аккаунт ${created.name} (${created.role})`,
    newValue: { id: created.id, name: created.name, email: created.email, role: created.role },
  });
  revalidateEntity(["/settings"]);
  redirect("/settings?added=1");
}
