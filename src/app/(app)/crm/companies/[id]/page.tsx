import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { EntityActions } from "@/components/crm/EntityActions";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { AuditPanel } from "@/components/crm/AuditPanel";
import { canHardDelete } from "@/lib/permissions";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: { responsible: true, contacts: { take: 10 }, partners: { take: 5 } },
  });
  if (!company) notFound();

  return (
    <div>
      <PageHeader
        title={company.name}
        description={`ID: ${company.id}`}
        actions={
          <EntityActions
            entity="company"
            id={company.id}
            archived={company.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/crm/companies/${company.id}/edit`}
            restoreTo={`/crm/companies/${company.id}`}
          />
        }
      />

      <div className="mb-4">
        <Badge status={company.status}>{company.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Карточка" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ["Правовая форма", company.legalForm],
              ["ИНН", company.inn],
              ["Город", company.city],
              ["Регион", company.region],
              ["Адрес", company.address],
              ["Телефон", company.phone],
              ["Email", company.email],
              ["Сайт", company.website],
              ["Тип", company.companyType],
              ["SKU", company.skuCount],
              ["Категории", company.categories],
              ["Ответственный", company.responsible?.name],
              ["Создана", formatDateTime(company.createdAt)],
              ["Последний контакт", formatDateTime(company.lastContactAt)],
              ["Следующий контакт", formatDateTime(company.nextContactAt)],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-900">{v ?? "—"}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Заметки</dt>
              <dd className="whitespace-pre-wrap">{company.notes || "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Активности">
          <ActivityFeed
            where={{ companyId: company.id }}
            redirectTo={`/crm/companies/${company.id}`}
          />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Аудит">
          <AuditPanel entityType="company" entityId={company.id} />
        </Card>
      </div>
    </div>
  );
}
