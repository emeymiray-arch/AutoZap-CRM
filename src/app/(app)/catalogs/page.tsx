import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, formatDate } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ListFilters } from "@/components/crm/ListFilters";
import { ExportButtons } from "@/components/crm/ExportButtons";
import { CATALOG_STATUS_LABELS } from "@/lib/labels";
import { parseListParams, scopeWhere, usersForSelect } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";

export default async function CatalogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const sp = parseListParams(await searchParams);
  const users = await usersForSelect();

  const where: Prisma.CatalogWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.responsibleId ? { responsibleId: sp.responsibleId } : {}),
    ...(sp.q ? { name: { contains: sp.q } } : {}),
  };
  if (sp.filter === "pending") {
    where.status = { in: ["RECEIVED", "REVIEW", "READY"] };
  }

  const rows = await prisma.catalog.findMany({
    where,
    include: { partner: true, responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Каталоги"
        actions={
          <>
            <ExportButtons entity="catalogs" />
            <Button href="/catalogs/new" size="sm">+ Создать</Button>
          </>
        }
      />
      <Suspense>
        <ListFilters
          entityType="catalogs"
          users={users}
          statusOptions={Object.entries(CATALOG_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </Suspense>
      <DataTable
        rows={rows}
        href={(r) => `/catalogs/${r.id}`}
        columns={[
          { key: "name", header: "Название", render: (r) => r.name },
          { key: "partner", header: "Партнёр", render: (r) => r.partner?.name || "—" },
          { key: "status", header: "Статус", render: (r) => <Badge status={r.status}>{CATALOG_STATUS_LABELS[r.status] || r.status}</Badge> },
          { key: "sku", header: "SKU", render: (r) => r.skuCount ?? r.rowCount ?? "—" },
          { key: "errors", header: "Ошибки", render: (r) => r.errorCount ?? "—" },
          { key: "updated", header: "Изменён", render: (r) => formatDate(r.updatedAt) },
        ]}
      />
    </div>
  );
}
