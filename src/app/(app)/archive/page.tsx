import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { EntityActions } from "@/components/crm/EntityActions";
import { canHardDelete } from "@/lib/permissions";
import { scopeWhere } from "@/lib/list-query";
import Link from "next/link";

export default async function ArchivePage() {
  const session = await auth();
  if (!session?.user) return null;
  const canDelete = canHardDelete(session.user.role);
  const scope = scopeWhere(session.user);

  const [leads, companies, contacts, deals, partners, stores, tasks] =
    await Promise.all([
      prisma.lead.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
      prisma.company.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
      prisma.contact.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
      prisma.deal.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
      prisma.partner.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
      prisma.store.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
      prisma.task.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
    ]);

  const sections: {
    title: string;
    entity: string;
    restoreBase: string;
    rows: { id: string; label: string; archivedAt: Date | null }[];
  }[] = [
    { title: "Лиды", entity: "lead", restoreBase: "/crm/leads", rows: leads.map((r) => ({ id: r.id, label: r.title, archivedAt: r.archivedAt })) },
    { title: "Компании", entity: "company", restoreBase: "/crm/companies", rows: companies.map((r) => ({ id: r.id, label: r.name, archivedAt: r.archivedAt })) },
    { title: "Контакты", entity: "contact", restoreBase: "/crm/contacts", rows: contacts.map((r) => ({ id: r.id, label: `${r.firstName} ${r.lastName || ""}`, archivedAt: r.archivedAt })) },
    { title: "Сделки", entity: "deal", restoreBase: "/crm/deals", rows: deals.map((r) => ({ id: r.id, label: r.title, archivedAt: r.archivedAt })) },
    { title: "Партнёры", entity: "partner", restoreBase: "/partners", rows: partners.map((r) => ({ id: r.id, label: r.name, archivedAt: r.archivedAt })) },
    { title: "Магазины", entity: "store", restoreBase: "/stores", rows: stores.map((r) => ({ id: r.id, label: r.name, archivedAt: r.archivedAt })) },
    { title: "Задачи", entity: "task", restoreBase: "/tasks", rows: tasks.map((r) => ({ id: r.id, label: r.title, archivedAt: r.archivedAt })) },
  ];

  return (
    <div>
      <PageHeader
        title="Архив"
        description="Просмотр, восстановление. Окончательное удаление — только администратор программы."
      />
      <div className="space-y-4">
        {sections.map((s) => (
          <Card key={s.entity} title={`${s.title} (${s.rows.length})`}>
            {s.rows.length === 0 ? (
              <div className="text-sm text-slate-500">Пусто</div>
            ) : (
              <ul className="space-y-3">
                {s.rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"
                  >
                    <div>
                      <Link href={`${s.restoreBase}/${r.id}`} className="font-medium hover:underline">
                        {r.label}
                      </Link>
                      <div className="text-xs text-slate-500">
                        ID: {r.id} · Архив: {formatDateTime(r.archivedAt)}
                      </div>
                    </div>
                    <EntityActions
                      entity={s.entity}
                      id={r.id}
                      archived
                      canDelete={canDelete}
                      editHref={`${s.restoreBase}/${r.id}`}
                      restoreTo={`${s.restoreBase}/${r.id}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
