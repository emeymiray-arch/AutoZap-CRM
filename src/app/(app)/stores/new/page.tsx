import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createStoreAction } from "@/lib/actions";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { RegionSelect } from "@/components/crm/GeoFields";
import { STORE_FUNNEL_ORDER, STORE_STATUS_LABELS } from "@/lib/labels";

export default async function NewStorePage() {
  await auth();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новый магазин" description="Мелкий магазин — отдельно от компаний и партнёров" />
      <Card>
        <form action={createStoreAction} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required className="md:col-span-2" />
          <RegionSelect />
          <Select name="status" label="Этап" defaultValue="NEW">
            {STORE_FUNNEL_ORDER.map((k) => (
              <option key={k} value={k}>
                {STORE_STATUS_LABELS[k]}
              </option>
            ))}
          </Select>
          <Input name="storeUrl" label="Ссылка" />
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
