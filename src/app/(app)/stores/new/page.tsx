import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createStoreAction } from "@/lib/actions";
import { partnersForSelect } from "@/lib/list-query";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { CompanyField } from "@/components/crm/CompanyField";
import { RegionSelect } from "@/components/crm/GeoFields";
import { STORE_STATUS_LABELS } from "@/lib/labels";

export default async function NewStorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await auth();
  const sp = await searchParams;
  const partnerId = typeof sp.partnerId === "string" ? sp.partnerId : "";
  const partners = await partnersForSelect();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новый магазин" />
      <Card>
        <form action={createStoreAction} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required className="md:col-span-2" />
          <Select name="partnerId" label="Партнёр" defaultValue={partnerId}>
            <option value="">—</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <CompanyField />
          <RegionSelect />
          <Select name="status" label="Статус" defaultValue="CREATING">
            {Object.entries(STORE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Input name="productCount" label="Количество товаров" type="number" />
          <Input name="storeUrl" label="Ссылка на магазин" />
          <ResponsibleSelect />
          <Textarea name="comment" label="Комментарий" className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
