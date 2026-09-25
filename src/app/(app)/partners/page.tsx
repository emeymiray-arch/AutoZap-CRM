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
import { PartnerKanban } from "@/components/kanban/PartnerKanban";
import {
  PARTNER_FUNNEL_ORDER,
  PARTNER_STATUS_LABELS,
  partnerFunnelStage,
} from "@/lib/labels";
import { parseListParams, dateRange, scopeWhere, usersForSelect, syncCompaniesIntoPartners } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  // Все компании сразу в партнёрах, на старте воронки
  await syncCompaniesIntoPartners();
  const raw = await searchParams;
  const sp = parseListParams(raw);
  const view = typeof raw.view === "string" && raw.view === "funnel" ? "funnel" : "cards";
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
      ? {
          OR: [
            { name: { contains: sp.q, mode: "insensitive" as const } },
            { region: { contains: sp.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  if (sp.filter === "contact_today") {
    where.nextContactAt = { gte: startOfDay(new Date()), lte: endOfDay(new Date()) };
  }

  const rows = await prisma.partner.findMany({
    where,
    include: { company: true, contact: true, responsible: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const funnelItems = rows.map((r) => ({
    id: r.id,
    title: r.name,
    stage: partnerFunnelStage(r.status),
    subtitle: r.contact
      ? [r.contact.firstName, r.contact.lastName].filter(Boolean).join(" ")
      : r.region,
    meta: r.responsible?.name || null,
  }));

  return (
    <div>
      <PageHeader
        title="Партнёры"
        description={`${rows.length} записей · карточки и воронка (этапы двигает человек)`}
        actions={
          <>
            <DataTools entity="partners" />
            <Button href="/partners/new" size="sm">
              + Создать
            </Button>
          </>
        }
      />
      <Suspense>
        <ViewTabs />
      </Suspense>

      {view === "funnel" ? (
        <PartnerKanban items={funnelItems} />
      ) : (
        <>
          <Suspense>
            <ListFilters
              entityType="partners"
              users={users}
              savedFilters={savedFilters}
              showRegion
              statusOptions={PARTNER_FUNNEL_ORDER.map((value) => ({
                value,
                label: PARTNER_STATUS_LABELS[value],
              }))}
            />
          </Suspense>
          <div className="mb-2 flex gap-2">
            <Button href="/partners?filter=contact_today" variant="ghost" size="sm">
              Контакт сегодня
            </Button>
          </div>
          <DataTable
            rows={rows}
            href={(r) => `/partners/${r.id}`}
            columns={[
              { key: "name", header: "Название", render: (r) => r.name },
              {
                key: "contact",
                header: "Контакт",
                render: (r) =>
                  r.contact
                    ? [r.contact.firstName, r.contact.lastName].filter(Boolean).join(" ") +
                      (r.contact.position ? ` · ${r.contact.position}` : "")
                    : "—",
              },
              { key: "region", header: "Регион", render: (r) => r.region || r.company?.region || "—" },
              {
                key: "production",
                header: "Производство",
                render: (r) => r.company?.productionCities || "—",
              },
              {
                key: "warehouses",
                header: "Склады",
                render: (r) => r.company?.warehouseCities || "—",
              },
              {
                key: "status",
                header: "Этап",
                render: (r) => (
                  <Badge status={r.status}>{PARTNER_STATUS_LABELS[r.status] || r.status}</Badge>
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
