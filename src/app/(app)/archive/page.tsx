import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { EntityActions } from "@/components/crm/EntityActions";
import { canHardDelete, canViewAll } from "@/lib/permissions";
import { scopeWhere } from "@/lib/list-query";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ArchivePage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!canViewAll(session.user.role)) redirect("/dashboard");
  const canDelete = canHardDelete(session.user.role);
  const scope = scopeWhere(session.user);

  const [partners, stores, people, tasks] = await Promise.all([
    prisma.partner.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
    prisma.store.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
    prisma.person.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
    prisma.task.findMany({ where: { archivedAt: { not: null }, ...scope }, orderBy: { archivedAt: "desc" }, take: 50 }),
  ]);

  const sections: {
    title: string;
    entity: string;
    restoreBase: string;
    rows: { id: string; label: string; archivedAt: Date | null }[];
  }[] = [
    { title: "Партнёры", entity: "partner", restoreBase: "/partners", rows: partners.map((r) => ({ id: r.id, label: r.name, archivedAt: r.archivedAt })) },
    { title: "Магазины", entity: "store", restoreBase: "/stores", rows: stores.map((r) => ({ id: r.id, label: r.name, archivedAt: r.archivedAt })) },
    { title: "Частники", entity: "person", restoreBase: "/people", rows: people.map((r) => ({ id: r.id, label: r.name, archivedAt: r.archivedAt })) },
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
              <p className="text-sm text-slate-500">Пусто</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {s.rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <Link href={`${s.restoreBase}/${r.id}`} className="font-medium hover:underline">
                        {r.label}
                      </Link>
                      <div className="text-xs text-slate-400">{formatDateTime(r.archivedAt)}</div>
                    </div>
                    <EntityActions
                      entity={s.entity}
                      id={r.id}
                      archived
                      canDelete={canDelete}
                      editHref={`${s.restoreBase}/${r.id}/edit`}
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
