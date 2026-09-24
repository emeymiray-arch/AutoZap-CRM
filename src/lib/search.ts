import { prisma } from "./db";
import type { SessionUser } from "./permissions";
import { canViewAll } from "./permissions";
import { containsInsensitive } from "./access";

export async function globalSearch(q: string, user: SessionUser, limit = 20) {
  const query = q.trim();
  if (!query || query.length < 2)
    return { companies: [], contacts: [], leads: [], deals: [], partners: [], stores: [], tasks: [] };

  const scope = canViewAll(user.role) ? {} : { responsibleId: user.id };
  const like = containsInsensitive(query);

  const [companies, contacts, leads, deals, partners, stores, tasks] = await Promise.all([
    prisma.company.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ name: like }, { inn: like }, { phone: like }, { email: like }, { city: like }],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.contact.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ firstName: like }, { lastName: like }, { phone: like }, { email: like }],
      },
      take: limit,
      include: { company: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ title: like }, { phone: like }, { email: like }, { city: like }],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.deal.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ title: like }, { comment: like }],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.partner.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ name: like }, { region: like }, { comment: like }],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.store.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ name: like }, { storeUrl: like }, { region: like }],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ title: like }, { description: like }],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { companies, contacts, leads, deals, partners, stores, tasks };
}
