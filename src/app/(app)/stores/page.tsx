import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { ViewTabs } from "@/components/crm/ViewTabs";
import { CompactEntityList } from "@/components/crm/CompactEntityList";
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
  const view = typeof raw.view === "string" && raw.view === "funnel" ? "funnel" : "list";

  const where: Prisma.StoreWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: "insensitive" as const } },
            { region: { contains: sp.q, mode: "insensitive" as const } },
            { contactName: { contains: sp.q, mode: "insensitive" as const } },
            { contactPhone: { contains: sp.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const rows = await prisma.store.findMany({
    where,
    select: {
      id: true,
      name: true,
      status: true,
      region: true,
      contactName: true,
      contactPhone: true,
      responsible: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const funnelItems = rows.map((r) => ({
    id: r.id,
    title: r.name,
    stage: storeFunnelStage(r.status),
    subtitle: r.region,
    meta: [r.contactName, r.contactPhone].filter(Boolean).join(" · ") || r.responsible?.name || null,
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
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Магазинов пока нет
        </div>
      ) : (
        <CompactEntityList
          rows={rows.map((r) => {
            const contact = [r.contactName, r.contactPhone].filter(Boolean).join(" · ");
            return {
              href: `/stores/${r.id}`,
              title: r.name,
              badge: {
                status: r.status,
                label: STORE_STATUS_LABELS[r.status] || r.status,
              },
              meta: contact || undefined,
              trailing: r.region || r.responsible?.name,
            };
          })}
        />
      )}
    </div>
  );
}
