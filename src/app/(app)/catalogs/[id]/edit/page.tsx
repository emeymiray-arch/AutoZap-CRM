import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateCatalogAction } from "@/lib/actions";
import { companiesForSelect, partnersForSelect, usersForSelect } from "@/lib/list-query";
import { CATALOG_STATUS_LABELS } from "@/lib/labels";

export default async function EditCatalogPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const catalog = await prisma.catalog.findUnique({ where: { id } });
  if (!catalog) notFound();
  const [companies, partners, users] = await Promise.all([
    companiesForSelect(),
    partnersForSelect(),
    usersForSelect(),
  ]);
  const action = updateCatalogAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${catalog.name}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required defaultValue={catalog.name} className="md:col-span-2" />
          <Select name="partnerId" label="Партнёр" defaultValue={catalog.partnerId || ""}>
            <option value="">—</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Select name="companyId" label="Компания" defaultValue={catalog.companyId || ""}>
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select name="status" label="Статус" defaultValue={catalog.status}>
            {Object.entries(CATALOG_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Input name="skuCount" label="Кол-во SKU" type="number" defaultValue={catalog.skuCount ?? ""} />
          <Select name="responsibleId" label="Ответственный" defaultValue={catalog.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Textarea name="comment" label="Комментарий" defaultValue={catalog.comment || ""} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
