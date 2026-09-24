import { prisma } from "./db";

export type DedupHit = {
  type: "company" | "contact";
  id: string;
  label: string;
  matchOn: string;
};

export async function findCompanyDuplicates(input: {
  inn?: string | null;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  excludeId?: string;
}): Promise<DedupHit[]> {
  const hits: DedupHit[] = [];
  const exclude = input.excludeId ? { id: { not: input.excludeId } } : {};

  if (input.inn) {
    const rows = await prisma.company.findMany({
      where: { inn: input.inn, archivedAt: null, ...exclude },
      take: 5,
    });
    for (const r of rows) hits.push({ type: "company", id: r.id, label: r.name, matchOn: "ИНН" });
  }
  if (input.phone) {
    const rows = await prisma.company.findMany({
      where: { phone: input.phone, archivedAt: null, ...exclude },
      take: 5,
    });
    for (const r of rows) hits.push({ type: "company", id: r.id, label: r.name, matchOn: "телефон" });
  }
  if (input.email) {
    const rows = await prisma.company.findMany({
      where: { email: input.email, archivedAt: null, ...exclude },
      take: 5,
    });
    for (const r of rows) hits.push({ type: "company", id: r.id, label: r.name, matchOn: "email" });
  }
  if (input.name) {
    const rows = await prisma.company.findMany({
      where: { name: { equals: input.name }, archivedAt: null, ...exclude },
      take: 5,
    });
    for (const r of rows) hits.push({ type: "company", id: r.id, label: r.name, matchOn: "название" });
  }

  const seen = new Set<string>();
  return hits.filter((h) => {
    if (seen.has(h.id)) return false;
    seen.add(h.id);
    return true;
  });
}

export async function findContactDuplicates(input: {
  phone?: string | null;
  email?: string | null;
  excludeId?: string;
}): Promise<DedupHit[]> {
  const hits: DedupHit[] = [];
  const exclude = input.excludeId ? { id: { not: input.excludeId } } : {};

  if (input.phone) {
    const rows = await prisma.contact.findMany({
      where: { phone: input.phone, archivedAt: null, ...exclude },
      take: 5,
    });
    for (const r of rows)
      hits.push({
        type: "contact",
        id: r.id,
        label: `${r.firstName} ${r.lastName || ""}`.trim(),
        matchOn: "телефон",
      });
  }
  if (input.email) {
    const rows = await prisma.contact.findMany({
      where: { email: input.email, archivedAt: null, ...exclude },
      take: 5,
    });
    for (const r of rows)
      hits.push({
        type: "contact",
        id: r.id,
        label: `${r.firstName} ${r.lastName || ""}`.trim(),
        matchOn: "email",
      });
  }

  const seen = new Set<string>();
  return hits.filter((h) => {
    if (seen.has(h.id)) return false;
    seen.add(h.id);
    return true;
  });
}
