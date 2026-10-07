import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { ViewTabs } from "@/components/crm/ViewTabs";
import { CompactEntityList } from "@/components/crm/CompactEntityList";
import { PersonKanban } from "@/components/kanban/PersonKanban";
import { PERSON_STATUS_LABELS, personFunnelStage } from "@/lib/labels";
import { scopeWhere } from "@/lib/list-query";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const raw = await searchParams;
  const view = typeof raw.view === "string" && raw.view === "funnel" ? "funnel" : "list";

  const rows = await prisma.person.findMany({
    where: { archivedAt: null, ...scopeWhere(session.user) },
    select: {
      id: true,
      name: true,
      phone: true,
      city: true,
      status: true,
      responsible: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const funnelItems = rows.map((r) => ({
    id: r.id,
    title: r.name,
    stage: personFunnelStage(r.status),
    subtitle: r.phone || r.city,
    meta: r.responsible?.name || null,
  }));

  return (
    <div>
      <PageHeader
        title="Частники"
        description={`${rows.length} человек`}
        actions={
          <Button href="/people/new" size="sm">
            + Добавить
          </Button>
        }
      />
      <Suspense>
        <ViewTabs />
      </Suspense>

      {view === "funnel" ? (
        <PersonKanban items={funnelItems} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Пока никого нет. Добавьте первого частника.
        </div>
      ) : (
        <CompactEntityList
          rows={rows.map((r) => ({
            href: `/people/${r.id}`,
            title: r.name,
            badge: {
              status: r.status,
              label: PERSON_STATUS_LABELS[r.status] || r.status,
            },
            meta: r.phone || undefined,
            trailing: r.city || r.responsible?.name,
          }))}
        />
      )}
    </div>
  );
}
