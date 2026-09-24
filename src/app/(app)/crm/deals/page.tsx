import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { ExportButtons } from "@/components/crm/ExportButtons";
import { DEAL_STAGE_LABELS } from "@/lib/labels";
import { parseListParams, dateRange, scopeWhere, usersForSelect } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";

export default async function DealsPage({
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
    where: { userId: session.user.id, entityType: "deals" },
  });

  let responsibleId = sp.responsibleId;
  if (responsibleId === "me") responsibleId = session.user.id;

  const where: Prisma.DealWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.stage ? { stage: sp.stage as never } : {}),
    ...(responsibleId ? { responsibleId } : {}),
    ...(sp.source ? { source: { contains: sp.source } } : {}),
    ...(dateRange(sp.from, sp.to) ? { createdAt: dateRange(sp.from, sp.to) } : {}),
    ...(sp.q
      ? {
          OR: [{ title: { contains: sp.q } }, { comment: { contains: sp.q } }],
        }
      : {}),
  };

  const deals = await prisma.deal.findMany({
    where,
    include: { company: true, responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Сделки"
        description={`${deals.length} записей`}
        actions={
          <>
            <ExportButtons entity="deals" />
            <Button href="/funnel" variant="secondary" size="sm">
              Воронка
            </Button>
            <Button href="/crm/deals/new" size="sm">
              + Создать
            </Button>
          </>
        }
      />
      <Suspense>
        <ListFilters
          entityType="deals"
          users={users}
          savedFilters={savedFilters}
          showSource
          stageOptions={Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </Suspense>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        <Button href="/crm/deals?responsibleId=me" variant="ghost" size="sm">
          Мои сделки
        </Button>
      </div>
      <DataTable
        rows={deals}
        href={(r) => `/crm/deals/${r.id}`}
        columns={[
          { key: "title", header: "Название", render: (r) => r.title },
          { key: "company", header: "Компания", render: (r) => r.company?.name || "—" },
          {
            key: "stage",
            header: "Этап",
            render: (r) => <Badge status={r.stage}>{DEAL_STAGE_LABELS[r.stage]}</Badge>,
          },
          {
            key: "amount",
            header: "Сумма",
            render: (r) => (r.amount != null ? r.amount.toLocaleString("ru-RU") : "—"),
          },
          { key: "resp", header: "Ответственный", render: (r) => r.responsible?.name || "—" },
          { key: "created", header: "Создана", render: (r) => formatDate(r.createdAt) },
        ]}
      />
    </div>
  );
}
