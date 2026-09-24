import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EntityActions } from "@/components/crm/EntityActions";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { AuditPanel } from "@/components/crm/AuditPanel";
import { LEAD_STATUS_LABELS } from "@/lib/labels";
import { convertLeadAction } from "@/lib/actions";
import { canHardDelete } from "@/lib/permissions";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { company: true, contact: true, responsible: true, partner: true },
  });
  if (!lead) notFound();

  return (
    <div>
      <PageHeader
        title={lead.title}
        description={`ID: ${lead.id}`}
        actions={
          <EntityActions
            entity="lead"
            id={lead.id}
            archived={lead.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/crm/leads/${lead.id}/edit`}
            restoreTo={`/crm/leads/${lead.id}`}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge status={lead.status}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
        {lead.status !== "CONVERTED" && !lead.archivedAt && (
          <form action={convertLeadAction.bind(null, lead.id)}>
            <Button type="submit" size="sm">
              Конвертировать в партнёра
            </Button>
          </form>
        )}
        {lead.partner && (
          <Button href={`/partners/${lead.partner.id}`} variant="secondary" size="sm">
            Открыть партнёра
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Карточка" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ["Компания", lead.company?.name],
              [
                "Контакт",
                lead.contact
                  ? `${lead.contact.firstName} ${lead.contact.lastName || ""}`
                  : null,
              ],
              ["Телефон", lead.phone],
              ["Email", lead.email],
              ["Город", lead.city],
              ["Регион", lead.region],
              ["Источник", lead.source],
              ["Сайт", lead.website],
              ["Avito", lead.avito],
              ["WB", lead.wildberries],
              ["Ozon", lead.ozon],
              ["Тип бизнеса", lead.businessType],
              ["Ассортимент", lead.assortment],
              ["Ответственный", lead.responsible?.name],
              ["Создан", formatDateTime(lead.createdAt)],
              ["Последний контакт", formatDateTime(lead.lastContactAt)],
              ["Следующий контакт", formatDateTime(lead.nextContactAt)],
              ["Причина отказа", lead.rejectReason],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-900">{v || "—"}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Комментарий</dt>
              <dd className="whitespace-pre-wrap">{lead.comment || "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Активности">
          <ActivityFeed where={{ leadId: lead.id, companyId: lead.companyId }} redirectTo={`/crm/leads/${lead.id}`} />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Аудит">
          <AuditPanel entityType="lead" entityId={lead.id} />
        </Card>
      </div>
    </div>
  );
}
