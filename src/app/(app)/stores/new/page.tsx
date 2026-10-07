import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createStoreAction } from "@/lib/actions";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { STORE_FUNNEL_ORDER, STORE_STATUS_LABELS } from "@/lib/labels";

export default async function NewStorePage() {
  await auth();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Новый магазин" description="Короткая карточка" />
      <Card>
        <form action={createStoreAction} className="grid gap-3">
          <Input name="name" label="Название" required />
          <Input name="region" label="Город" placeholder="Москва" />
          <Input name="storeUrl" label="Ссылка" placeholder="https://…" />
          <Select name="status" label="Этап" defaultValue="NEW">
            {STORE_FUNNEL_ORDER.map((k) => (
              <option key={k} value={k}>
                {STORE_STATUS_LABELS[k]}
              </option>
            ))}
          </Select>
          <ResponsibleSelect />
          <Textarea name="comment" label="Комментарий" rows={2} />
          <Button type="submit">Создать</Button>
        </form>
      </Card>
    </div>
  );
}
