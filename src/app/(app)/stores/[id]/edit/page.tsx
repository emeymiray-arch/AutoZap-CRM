import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateStoreAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";
import { STORE_FUNNEL_ORDER, STORE_STATUS_LABELS } from "@/lib/labels";
import { RegionSelect } from "@/components/crm/GeoFields";

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) notFound();
  const users = await usersForSelect();
  const action = updateStoreAction.bind(null, id);
  const statusOptions = STORE_FUNNEL_ORDER.includes(store.status as never)
    ? STORE_FUNNEL_ORDER
    : ([store.status, ...STORE_FUNNEL_ORDER] as string[]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${store.name}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required defaultValue={store.name} className="md:col-span-2" />
          <Select name="status" label="Этап" defaultValue={store.status}>
            {statusOptions.map((k) => (
              <option key={k} value={k}>
                {STORE_STATUS_LABELS[k] || k}
              </option>
            ))}
          </Select>
          <RegionSelect defaultValue={store.region} />
          <Input name="storeUrl" label="Ссылка" defaultValue={store.storeUrl || ""} />
          <Select name="responsibleId" label="Ответственный" defaultValue={store.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Textarea name="comment" label="Комментарий" defaultValue={store.comment || ""} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
