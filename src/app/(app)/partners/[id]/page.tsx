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
    include: {
      company: true,
      responsible: true,
      catalogs: { where: { archivedAt: null }, orderBy: { updatedAt: "desc" } },
      stores: { where: { archivedAt: null }, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!partner) notFound();

  return (
    <div>
      <PageHeader
        title={partner.name}
        description={`ID: ${partner.id}`}
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
      <div className="mb-4"><Badge status={partner.status}>{PARTNER_STATUS_LABELS[partner.status] || partner.status}</Badge></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Карточка" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ["Компания", partner.company?.name],
              ["Регион", partner.region],
              ["Ответственный", partner.responsible?.name],
              ["Регистрация", formatDateTime(partner.registeredAt)],
              ["Активация", formatDateTime(partner.activatedAt)],
              ["Следующий контакт", formatDateTime(partner.nextContactAt)],
            ].map(([k, v]) => (
              <div key={String(k)}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>
            ))}
            <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Комментарий</dt><dd>{partner.comment || "—"}</dd></div>
          </dl>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Каталоги</h3>
              <Button href={`/catalogs/new?partnerId=${partner.id}`} size="sm" variant="secondary">+ Каталог</Button>
            </div>
            <ul className="space-y-1 text-sm">
              {partner.catalogs.map((c) => (
                <li key={c.id}><a className="text-teal-800 hover:underline" href={`/catalogs/${c.id}`}>{c.name}</a> · {c.status}</li>
              ))}
              {partner.catalogs.length === 0 && <li className="text-slate-500">Нет каталогов</li>}
            </ul>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Магазины</h3>
              <Button href={`/stores/new?partnerId=${partner.id}`} size="sm" variant="secondary">+ Магазин</Button>
            </div>
            <ul className="space-y-1 text-sm">
              {partner.stores.map((s) => (
                <li key={s.id}><a className="text-teal-800 hover:underline" href={`/stores/${s.id}`}>{s.name}</a> · {s.status}</li>
              ))}
              {partner.stores.length === 0 && <li className="text-slate-500">Нет магазинов</li>}
            </ul>
          </div>
        </Card>
        <Card title="Активности">
          <ActivityFeed where={{ partnerId: partner.id, companyId: partner.companyId }} redirectTo={`/partners/${partner.id}`} />
        </Card>
      </div>
      <div className="mt-4"><Card title="Аудит"><AuditPanel entityType="partner" entityId={partner.id} /></Card></div>
    </div>
  );
}
