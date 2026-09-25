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
import { STORE_FUNNEL_ORDER, STORE_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";
import { updateStoreAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";
import { RegionSelect } from "@/components/crm/GeoFields";

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
    include: { responsible: true },
  });
  if (!store) notFound();
  const users = await usersForSelect();
  const action = updateStoreAction.bind(null, id);
  const statusOptions = STORE_FUNNEL_ORDER.includes(store.status as never)
    ? [...STORE_FUNNEL_ORDER]
    : [store.status, ...STORE_FUNNEL_ORDER];

  return (
    <div>
      <PageHeader
        title={store.name}
        description="Мелкий магазин"
        actions={
          <EntityActions
            entity="store"
            id={store.id}
            archived={store.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/stores/${id}/edit`}
            restoreTo={`/stores/${id}`}
          />
        }
      />
      <Badge status={store.status}>{STORE_STATUS_LABELS[store.status] || store.status}</Badge>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Карточка" className="lg:col-span-2">
          <form action={action} className="grid gap-3 md:grid-cols-2">
            <Input name="name" label="Название" required defaultValue={store.name} className="md:col-span-2" />
            <RegionSelect defaultValue={store.region} />
            <Select name="status" label="Этап" defaultValue={store.status}>
              {statusOptions.map((k) => (
                <option key={k} value={k}>
                  {STORE_STATUS_LABELS[k] || k}
                </option>
              ))}
            </Select>
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
              Создан: {formatDateTime(store.createdAt)}
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="sm">
                Сохранить
              </Button>
            </div>
          </form>
        </Card>
        <Card title="Активности">
          <ActivityFeed where={{ storeId: store.id }} redirectTo={`/stores/${id}`} />
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
