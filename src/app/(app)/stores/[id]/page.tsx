import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { EntityActions } from "@/components/crm/EntityActions";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { AuditPanel } from "@/components/crm/AuditPanel";
import { STORE_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";
import { updateStoreAction } from "@/lib/actions";
import { companiesForSelect, partnersForSelect, usersForSelect } from "@/lib/list-query";

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    include: { partner: true, company: true, responsible: true },
  });
  if (!store) notFound();
  const [companies, partners, users] = await Promise.all([
    companiesForSelect(),
    partnersForSelect(),
    usersForSelect(),
  ]);
  const action = updateStoreAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title={store.name}
        description={`ID: ${store.id}`}
        actions={
          <EntityActions
            entity="store"
            id={store.id}
            archived={store.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/stores/${id}`}
            restoreTo={`/stores/${id}`}
          />
        }
      />
      <Badge status={store.status}>{STORE_STATUS_LABELS[store.status] || store.status}</Badge>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Карточка / изменение" className="lg:col-span-2">
          <form action={action} className="grid gap-3 md:grid-cols-2">
            <Input name="name" label="Название" required defaultValue={store.name} className="md:col-span-2" />
            <Select name="partnerId" label="Партнёр" defaultValue={store.partnerId || ""}>
              <option value="">—</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select name="companyId" label="Компания" defaultValue={store.companyId || ""}>
              <option value="">—</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input name="region" label="Регион" defaultValue={store.region || ""} />
            <Select name="status" label="Статус" defaultValue={store.status}>
              {Object.entries(STORE_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Input
              name="productCount"
              label="Товары"
              type="number"
              defaultValue={store.productCount ?? undefined}
            />
            <Input name="storeUrl" label="Ссылка" defaultValue={store.storeUrl || ""} />
            <Select name="responsibleId" label="Ответственный" defaultValue={store.responsibleId || ""}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
            <Textarea name="comment" label="Комментарий" defaultValue={store.comment || ""} className="md:col-span-2" />
            <div className="md:col-span-2 text-xs text-slate-500">
              Регистрация: {formatDateTime(store.registeredAt)} · Публикация:{" "}
              {formatDateTime(store.publishedAt)} · Активация: {formatDateTime(store.activatedAt)}
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="sm">
                Сохранить
              </Button>
            </div>
          </form>
        </Card>
        <Card title="Активности">
          <ActivityFeed
            where={{ storeId: store.id, partnerId: store.partnerId, companyId: store.companyId }}
            redirectTo={`/stores/${id}`}
          />
        </Card>
      </div>
      <div className="mt-4">
        <Card title="Аудит">
          <AuditPanel entityType="store" entityId={id} />
        </Card>
      </div>
    </div>
  );
}
