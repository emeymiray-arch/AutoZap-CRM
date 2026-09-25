import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { DataTools } from "@/components/crm/DataTools";
import { ViewTabs } from "@/components/crm/ViewTabs";
import { StoreKanban } from "@/components/kanban/StoreKanban";
import { STORE_FUNNEL_ORDER, STORE_STATUS_LABELS, storeFunnelStage } from "@/lib/labels";
import { parseListParams, scopeWhere, usersForSelect } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const raw = await searchParams;
  const sp = parseListParams(raw);
  const view = typeof raw.view === "string" && raw.view === "funnel" ? "funnel" : "cards";
  const users = await usersForSelect();

  const where: Prisma.StoreWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.responsibleId ? { responsibleId: sp.responsibleId } : {}),
    ...(sp.region ? { region: { contains: sp.region, mode: "insensitive" as const } } : {}),
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: "insensitive" as const } },
            { storeUrl: { contains: sp.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const rows = await prisma.store.findMany({
    where,
    include: { responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const funnelItems = rows.map((r) => ({
    id: r.id,
    title: r.name,
    stage: storeFunnelStage(r.status),
    subtitle: r.region,
    meta: r.responsible?.name || null,
  }));

  return (
    <div>
      <PageHeader
        title="Магазины"
        description={`${rows.length} записей · мелкие магазины (отдельно от компаний)`}
        actions={
          <>
            <DataTools entity="stores" />
            <Button href="/stores/new" size="sm">
              + Создать
            </Button>
          </>
        }
      />
      <Suspense>
        <ViewTabs />
      </Suspense>

      {view === "funnel" ? (
        <StoreKanban items={funnelItems} />
      ) : (
        <>
          <Suspense>
            <ListFilters
              entityType="stores"
              users={users}
              showRegion
              statusOptions={STORE_FUNNEL_ORDER.map((value) => ({
                value,
                label: STORE_STATUS_LABELS[value],
              }))}
            />
          </Suspense>
          <DataTable
            rows={rows}
            href={(r) => `/stores/${r.id}`}
            columns={[
              { key: "name", header: "Название", render: (r) => r.name },
              { key: "region", header: "Регион", render: (r) => r.region || "—" },
              {
                key: "status",
                header: "Этап",
                render: (r) => (
                  <Badge status={r.status}>{STORE_STATUS_LABELS[r.status] || r.status}</Badge>
                ),
              },
              { key: "resp", header: "Ответственный", render: (r) => r.responsible?.name || "—" },
              { key: "updated", header: "Изменён", render: (r) => formatDate(r.updatedAt) },
            ]}
          />
        </>
      )}
    </div>
  );
}
