import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EntityActions } from "@/components/crm/EntityActions";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { AuditPanel } from "@/components/crm/AuditPanel";
import { PARTNER_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { company: true, responsible: true },
  });
  if (!partner) notFound();

  return (
    <div>
      <PageHeader
        title={partner.name}
        description="Крупная компания / партнёр"
        actions={
          <EntityActions
            entity="partner"
            id={partner.id}
            archived={partner.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/partners/${partner.id}/edit`}
            restoreTo={`/partners/${partner.id}`}
          />
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge status={partner.status}>{PARTNER_STATUS_LABELS[partner.status] || partner.status}</Badge>
        <Button href="/partners?view=funnel" size="sm" variant="secondary">
          Воронка
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Карточка" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ["Компания", partner.company?.name],
              ["Регион", partner.region || partner.company?.region],
              ["Склады", partner.company?.warehouseCities],
              ["Производство", partner.company?.productionCities],
              ["Магазины (города)", partner.company?.storeCities],
              ["Ответственный", partner.responsible?.name],
              ["Следующий контакт", formatDateTime(partner.nextContactAt)],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium">{v || "—"}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Комментарий</dt>
              <dd>{partner.comment || "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Активности">
          <ActivityFeed
            where={{ partnerId: partner.id, companyId: partner.companyId }}
            redirectTo={`/partners/${partner.id}`}
          />
        </Card>
      </div>
      <div className="mt-4">
        <Card title="Аудит">
          <AuditPanel entityType="partner" entityId={partner.id} />
        </Card>
      </div>
    </div>
  );
}
