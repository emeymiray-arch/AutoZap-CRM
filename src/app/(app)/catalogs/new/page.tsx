import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createCatalogAction } from "@/lib/actions";
import { companiesForSelect, partnersForSelect, usersForSelect } from "@/lib/list-query";
import { CATALOG_STATUS_LABELS } from "@/lib/labels";

export default async function NewCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await auth();
  const sp = await searchParams;
  const partnerId = typeof sp.partnerId === "string" ? sp.partnerId : "";
  const [companies, partners, users] = await Promise.all([
    companiesForSelect(),
    partnersForSelect(),
    usersForSelect(),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новый каталог" />
      <Card>
        <form action={createCatalogAction} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required className="md:col-span-2" />
          <Select name="partnerId" label="Партнёр" defaultValue={partnerId}>
            <option value="">—</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select name="companyId" label="Компания">
            <option value="">—</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select name="status" label="Статус" defaultValue="EXPECTED">
            {Object.entries(CATALOG_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input name="skuCount" label="Количество SKU" type="number" />
          <Input name="receivedAt" label="Дата получения" type="date" />
          <Select name="responsibleId" label="Ответственный">
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Textarea name="comment" label="Комментарий" className="md:col-span-2" />
          <div className="md:col-span-2"><Button type="submit">Создать</Button></div>
        </form>
      </Card>
    </div>
  );
}
