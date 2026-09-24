import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { ExportButtons } from "@/components/crm/ExportButtons";
import { STORE_STATUS_LABELS } from "@/lib/labels";
import { parseListParams, scopeWhere, usersForSelect } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const sp = parseListParams(await searchParams);
  const users = await usersForSelect();
  const where: Prisma.StoreWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.responsibleId ? { responsibleId: sp.responsibleId } : {}),
    ...(sp.region ? { region: { contains: sp.region } } : {}),
    ...(sp.q ? { OR: [{ name: { contains: sp.q } }, { storeUrl: { contains: sp.q } }] } : {}),
  };
  if (sp.filter === "processing") {
    where.status = { in: ["CREATING", "SETUP", "CATALOG_LOADING", "REVIEW"] };
  }
  const rows = await prisma.store.findMany({
    where,
    include: { partner: true, responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return (
    <div>
      <PageHeader
        title="Магазины"
        actions={
          <>
            <ExportButtons entity="stores" />
            <Button href="/stores/new" size="sm">
              + Создать
            </Button>
          </>
        }
      />
      <Suspense>
        <ListFilters
          entityType="stores"
          users={users}
          showRegion
          statusOptions={Object.entries(STORE_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </Suspense>
      <Button href="/stores?filter=processing" variant="ghost" size="sm" className="mb-2">
        Магазины в обработке
      </Button>
      <DataTable
        rows={rows}
        href={(r) => `/stores/${r.id}`}
        columns={[
          { key: "name", header: "Название", render: (r) => r.name },
          { key: "partner", header: "Партнёр", render: (r) => r.partner?.name || "—" },
          {
            key: "status",
            header: "Статус",
            render: (r) => (
              <Badge status={r.status}>{STORE_STATUS_LABELS[r.status] || r.status}</Badge>
            ),
          },
          { key: "products", header: "Товары", render: (r) => r.productCount ?? "—" },
          { key: "resp", header: "Ответственный", render: (r) => r.responsible?.name || "—" },
          { key: "updated", header: "Изменён", render: (r) => formatDate(r.updatedAt) },
        ]}
      />
    </div>
  );
}
