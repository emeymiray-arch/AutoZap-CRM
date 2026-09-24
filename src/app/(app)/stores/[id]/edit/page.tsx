import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateStoreAction } from "@/lib/actions";
import { companiesForSelect, partnersForSelect, usersForSelect } from "@/lib/list-query";
import { STORE_STATUS_LABELS } from "@/lib/labels";

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) notFound();
  const [companies, partners, users] = await Promise.all([
    companiesForSelect(),
    partnersForSelect(),
    usersForSelect(),
  ]);
  const action = updateStoreAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${store.name}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required defaultValue={store.name} className="md:col-span-2" />
          <Select name="partnerId" label="Партнёр" defaultValue={store.partnerId || ""}>
            <option value="">—</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Select name="companyId" label="Компания" defaultValue={store.companyId || ""}>
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select name="status" label="Статус" defaultValue={store.status}>
            {Object.entries(STORE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Input name="region" label="Регион" defaultValue={store.region || ""} />
          <Input name="productCount" label="Кол-во товаров" type="number" defaultValue={store.productCount ?? ""} />
          <Input name="storeUrl" label="URL магазина" defaultValue={store.storeUrl || ""} />
          <Select name="responsibleId" label="Ответственный" defaultValue={store.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
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
