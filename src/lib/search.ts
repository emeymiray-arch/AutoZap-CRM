import { prisma } from "./db";
import type { SessionUser } from "./permissions";
import { canSeeTeamRecords } from "./permissions";
import { containsInsensitive } from "./access";

export async function globalSearch(q: string, user: SessionUser, limit = 20) {
  const query = q.trim();
  if (!query || query.length < 2)
    return { partners: [], people: [], stores: [], tasks: [] };

  const scope = canSeeTeamRecords(user.role) ? {} : { responsibleId: user.id };
  const like = containsInsensitive(query);

  const [partners, people, stores, tasks] = await Promise.all([
    prisma.partner.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ name: like }, { region: like }, { comment: like }],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.person.findMany({
      where: {
        archivedAt: null,
        ...scope,
        OR: [{ name: like }, { phone: like }, { city: like }],
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

  return { partners, people, stores, tasks };
}
