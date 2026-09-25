import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/permissions";
import { canViewAll } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";

export function parseListParams(sp: Record<string, string | string[] | undefined>) {
  const g = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    q: g("q") || "",
    status: g("status") || "",
    stage: g("stage") || "",
    responsibleId: g("responsibleId") || "",
    region: g("region") || "",
    source: g("source") || "",
    from: g("from") || "",
    to: g("to") || "",
    deadline: g("deadline") || "",
    filter: g("filter") || "",
  };
}

export function dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  const r: Prisma.DateTimeFilter = {};
  if (from) r.gte = new Date(from);
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    r.lte = d;
  }
  return r;
}

export function scopeWhere(user: SessionUser) {
  return canViewAll(user.role) ? {} : { responsibleId: user.id };
}

export async function usersForSelect() {
  return prisma.user.findMany({
    where: { active: true, archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function companiesForSelect() {
  return prisma.company.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
    take: 500,
  });
}

export async function partnersForSelect() {
  return prisma.partner.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
    take: 500,
  });
}

export async function contactsForSelect(companyId?: string) {
  return prisma.contact.findMany({
    where: { archivedAt: null, ...(companyId ? { companyId } : {}) },
    orderBy: { firstName: "asc" },
    select: { id: true, firstName: true, lastName: true, companyId: true, position: true, phone: true },
    take: 500,
  });
}

/**
 * Компании = партнёры: любая компания без партнёра появляется в списке
 * на начальном этапе воронки (NEW), дальше двигает человек.
 */
export async function syncCompaniesIntoPartners() {
  const orphanCompanies = await prisma.company.findMany({
    where: {
      archivedAt: null,
      partners: { none: { archivedAt: null } },
    },
    select: {
      id: true,
      name: true,
      region: true,
      responsibleId: true,
      createdById: true,
    },
  });

  for (const c of orphanCompanies) {
    await prisma.partner.create({
      data: {
        name: c.name,
        companyId: c.id,
        status: "NEW",
        region: c.region,
        responsibleId: c.responsibleId,
        createdById: c.createdById,
      },
    });
  }

  return orphanCompanies.length;
}
