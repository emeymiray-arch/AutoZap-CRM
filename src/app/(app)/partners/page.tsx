import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { DataTools } from "@/components/crm/DataTools";
import { PARTNER_STATUS_LABELS } from "@/lib/labels";
import { parseListParams, dateRange, scopeWhere, usersForSelect } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const sp = parseListParams(await searchParams);
  const users = await usersForSelect();
  const savedFilters = await prisma.savedFilter.findMany({
    where: { userId: session.user.id, entityType: "partners" },
  });

  const where: Prisma.PartnerWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.responsibleId ? { responsibleId: sp.responsibleId } : {}),
    ...(sp.region ? { region: { contains: sp.region, mode: "insensitive" as const } } : {}),
    ...(dateRange(sp.from, sp.to) ? { createdAt: dateRange(sp.from, sp.to) } : {}),
    ...(sp.q
      ? { OR: [{ name: { contains: sp.q, mode: "insensitive" as const } }, { region: { contains: sp.q, mode: "insensitive" as const } }] }
      : {}),
  };

  if (sp.filter === "contact_today") {
    where.nextContactAt = { gte: startOfDay(new Date()), lte: endOfDay(new Date()) };
  }

  const rows = await prisma.partner.findMany({
    where,
    include: { company: true, responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Партнёры"
        description={`${rows.length} записей`}
        actions={
          <>
            <DataTools entity="partners" />
            <Button href="/partners/new" size="sm">+ Создать</Button>
          </>
        }
      />
      <Suspense>
        <ListFilters
          entityType="partners"
          users={users}
          savedFilters={savedFilters}
          showRegion
          statusOptions={Object.entries(PARTNER_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </Suspense>
      <div className="mb-2 flex gap-2">
        <Button href="/partners?status=WAITING_CATALOG" variant="ghost" size="sm">Ожидаем каталог</Button>
        <Button href="/partners?filter=contact_today" variant="ghost" size="sm">Контакт сегодня</Button>
      </div>
      <DataTable
        rows={rows}
        href={(r) => `/partners/${r.id}`}
        columns={[
          { key: "name", header: "Название", render: (r) => r.name },
          { key: "company", header: "Компания", render: (r) => r.company?.name || "—" },
          { key: "status", header: "Статус", render: (r) => <Badge status={r.status}>{PARTNER_STATUS_LABELS[r.status] || r.status}</Badge> },
          { key: "resp", header: "Ответственный", render: (r) => r.responsible?.name || "—" },
          { key: "updated", header: "Изменён", render: (r) => formatDate(r.updatedAt) },
        ]}
      />
    </div>
  );
}
