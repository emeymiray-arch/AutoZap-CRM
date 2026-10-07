import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { ViewTabs } from "@/components/crm/ViewTabs";
import { EntityCard, EntityCardGrid } from "@/components/crm/EntityCard";
import { StoreKanban } from "@/components/kanban/StoreKanban";
import { STORE_STATUS_LABELS, storeFunnelStage } from "@/lib/labels";
import { parseListParams, scopeWhere } from "@/lib/list-query";
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

  const where: Prisma.StoreWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: "insensitive" as const } },
            { storeUrl: { contains: sp.q, mode: "insensitive" as const } },
            { region: { contains: sp.q, mode: "insensitive" as const } },
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
        description={`${rows.length} точек`}
        actions={
          <Button href="/stores/new" size="sm">
            + Магазин
          </Button>
        }
      />
      <Suspense>
        <ViewTabs />
      </Suspense>

      {view === "funnel" ? (
        <StoreKanban items={funnelItems} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Магазинов пока нет
        </div>
      ) : (
        <EntityCardGrid>
          {rows.map((r) => (
            <EntityCard
              key={r.id}
              href={`/stores/${r.id}`}
              title={r.name}
              badge={{
                status: r.status,
                label: STORE_STATUS_LABELS[r.status] || r.status,
              }}
              lines={[
                { label: "Город", value: r.region },
                { label: "Ссылка", value: r.storeUrl },
                { label: "Ответственный", value: r.responsible?.name },
              ]}
            />
          ))}
        </EntityCardGrid>
      )}
    </div>
  );
}
