import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { LEAD_STATUS_LABELS } from "@/lib/labels";
import { parseListParams, dateRange, scopeWhere, usersForSelect } from "@/lib/list-query";
import { ExportButtons } from "@/components/crm/ExportButtons";
import type { Prisma } from "@prisma/client";

export default async function LeadsPage({
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
    where: { userId: session.user.id, entityType: "leads" },
  });

  let responsibleId = sp.responsibleId;
  if (responsibleId === "me") responsibleId = session.user.id;

  const where: Prisma.LeadWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status as never } : {}),
    ...(responsibleId ? { responsibleId } : {}),
    ...(sp.region ? { region: { contains: sp.region } } : {}),
    ...(sp.source ? { source: { contains: sp.source } } : {}),
    ...(dateRange(sp.from, sp.to) ? { createdAt: dateRange(sp.from, sp.to) } : {}),
    ...(sp.q
      ? {
          OR: [
            { title: { contains: sp.q } },
            { phone: { contains: sp.q } },
            { email: { contains: sp.q } },
            { city: { contains: sp.q } },
          ],
        }
      : {}),
  };

  if (sp.filter === "call_today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.nextContactAt = { gte: start, lte: end };
  }

  const leads = await prisma.lead.findMany({
    where,
    include: { company: true, responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Лиды"
        description={`${leads.length} записей`}
        actions={
          <>
            <ExportButtons entity="leads" />
            <Button href="/crm/leads/import" variant="secondary" size="sm">
              Импорт
            </Button>
            <Button href="/crm/leads/new" size="sm">
              + Создать
            </Button>
          </>
        }
      />
      <Suspense>
        <ListFilters
          entityType="leads"
          users={users}
          savedFilters={savedFilters}
          showRegion
          showSource
          statusOptions={Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </Suspense>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <Button href={`/crm/leads?responsibleId=me`} variant="ghost" size="sm">
          Мои лиды
        </Button>
        <Button href="/crm/leads?filter=call_today" variant="ghost" size="sm">
          Нужно позвонить сегодня
        </Button>
      </div>
      <DataTable
        rows={leads}
        href={(r) => `/crm/leads/${r.id}`}
        columns={[
          { key: "title", header: "Название", render: (r) => r.title },
          { key: "company", header: "Компания", render: (r) => r.company?.name || "—" },
          {
            key: "status",
            header: "Статус",
            render: (r) => <Badge status={r.status}>{LEAD_STATUS_LABELS[r.status]}</Badge>,
          },
          { key: "source", header: "Источник", render: (r) => r.source || "—" },
          { key: "resp", header: "Ответственный", render: (r) => r.responsible?.name || "—" },
          { key: "created", header: "Создан", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </div>
  );
}
