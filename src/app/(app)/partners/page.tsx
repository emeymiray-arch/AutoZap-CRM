import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { ViewTabs } from "@/components/crm/ViewTabs";
import { CompactEntityList } from "@/components/crm/CompactEntityList";
import { PartnerKanban } from "@/components/kanban/PartnerKanban";
import { PARTNER_STATUS_LABELS, partnerFunnelStage } from "@/lib/labels";
import { parseListParams, scopeWhere } from "@/lib/list-query";
import type { Prisma } from "@prisma/client";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const raw = await searchParams;
  const sp = parseListParams(raw);
  const view = typeof raw.view === "string" && raw.view === "funnel" ? "funnel" : "list";

  const where: Prisma.PartnerWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: "insensitive" as const } },
            { region: { contains: sp.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const rows = await prisma.partner.findMany({
    where,
    select: {
      id: true,
      name: true,
      status: true,
      region: true,
      company: { select: { city: true } },
      contact: { select: { firstName: true, phone: true } },
      responsible: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const funnelItems = rows.map((r) => ({
    id: r.id,
    title: r.name,
    stage: partnerFunnelStage(r.status),
    subtitle: r.company?.city || r.region || null,
    meta: r.contact?.firstName || r.responsible?.name || null,
  }));

  return (
    <div>
      <PageHeader
        title="Партнёры"
        description={`${rows.length} компаний`}
        actions={
          <Button href="/partners/new" size="sm">
            + Партнёр
          </Button>
        }
      />
      <Suspense>
        <ViewTabs />
      </Suspense>

      {view === "funnel" ? (
        <PartnerKanban items={funnelItems} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Партнёров пока нет
        </div>
      ) : (
        <CompactEntityList
          rows={rows.map((r) => {
            const contact = r.contact
              ? [r.contact.firstName, r.contact.phone].filter(Boolean).join(" · ")
              : null;
            return {
              href: `/partners/${r.id}`,
              title: r.name,
              badge: {
                status: r.status,
                label: PARTNER_STATUS_LABELS[r.status] || r.status,
              },
              meta: contact || undefined,
              trailing: r.company?.city || r.region || r.responsible?.name,
            };
          })}
        />
      )}
    </div>
  );
}
