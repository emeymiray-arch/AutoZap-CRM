import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { ListFilters } from "@/components/crm/ListFilters";
import { ExportButtons } from "@/components/crm/ExportButtons";
import { parseListParams, dateRange, scopeWhere, usersForSelect } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const raw = await searchParams;
  const sp = parseListParams(raw);
  const users = await usersForSelect();
  const savedFilters = await prisma.savedFilter.findMany({
    where: { userId: session.user.id, entityType: "contacts" },
  });

  let responsibleId = sp.responsibleId;
  if (responsibleId === "me") responsibleId = session.user.id;

  const where: Prisma.ContactWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(responsibleId ? { responsibleId } : {}),
    ...(dateRange(sp.from, sp.to) ? { createdAt: dateRange(sp.from, sp.to) } : {}),
    ...(sp.q
      ? {
          OR: [
            { firstName: { contains: sp.q } },
            { lastName: { contains: sp.q } },
            { phone: { contains: sp.q } },
            { email: { contains: sp.q } },
          ],
        }
      : {}),
  };

  const contacts = await prisma.contact.findMany({
    where,
    include: { company: true, responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Контакты"
        description={`${contacts.length} записей`}
        actions={
          <>
            <ExportButtons entity="contacts" />
            <Button href="/crm/contacts/new" size="sm">
              + Создать
            </Button>
          </>
        }
      />
      <Suspense>
        <ListFilters entityType="contacts" users={users} savedFilters={savedFilters} />
      </Suspense>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <Button href="/crm/contacts?responsibleId=me" variant="ghost" size="sm">
          Мои контакты
        </Button>
      </div>
      <DataTable
        rows={contacts}
        href={(r) => `/crm/contacts/${r.id}`}
        columns={[
          {
            key: "name",
            header: "Имя",
            render: (r) => `${r.firstName} ${r.lastName || ""}`.trim(),
          },
          { key: "company", header: "Компания", render: (r) => r.company?.name || "—" },
          { key: "phone", header: "Телефон", render: (r) => r.phone || "—" },
          { key: "email", header: "Email", render: (r) => r.email || "—" },
          { key: "position", header: "Должность", render: (r) => r.position || "—" },
          { key: "resp", header: "Ответственный", render: (r) => r.responsible?.name || "—" },
          { key: "created", header: "Создан", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </div>
  );
}
