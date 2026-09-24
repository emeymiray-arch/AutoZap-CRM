import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EntityActions } from "@/components/crm/EntityActions";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { AuditPanel } from "@/components/crm/AuditPanel";
import { DEAL_STAGE_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { company: true, contact: true, lead: true, responsible: true },
  });
  if (!deal) notFound();

  return (
    <div>
      <PageHeader
        title={deal.title}
        description={`ID: ${deal.id}`}
        actions={
          <EntityActions
            entity="deal"
            id={deal.id}
            archived={deal.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/crm/deals/${deal.id}/edit`}
            restoreTo={`/crm/deals/${deal.id}`}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge status={deal.stage}>{DEAL_STAGE_LABELS[deal.stage]}</Badge>
        {deal.lead && (
          <Button href={`/crm/leads/${deal.lead.id}`} variant="secondary" size="sm">
            Открыть лид
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Карточка" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ["Компания", deal.company?.name],
              [
                "Контакт",
                deal.contact
                  ? `${deal.contact.firstName} ${deal.contact.lastName || ""}`
                  : null,
              ],
              ["Источник", deal.source],
              ["Сумма", deal.amount != null ? deal.amount.toLocaleString("ru-RU") : null],
              ["Следующий шаг", deal.nextStep],
              ["Дедлайн", formatDateTime(deal.deadline)],
              ["Ответственный", deal.responsible?.name],
              ["Создана", formatDateTime(deal.createdAt)],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-900">{v || "—"}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Комментарий</dt>
              <dd className="whitespace-pre-wrap">{deal.comment || "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Активности">
          <ActivityFeed
            where={{ dealId: deal.id, companyId: deal.companyId }}
            redirectTo={`/crm/deals/${deal.id}`}
          />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Аудит">
          <AuditPanel entityType="deal" entityId={deal.id} />
        </Card>
      </div>
    </div>
  );
}
