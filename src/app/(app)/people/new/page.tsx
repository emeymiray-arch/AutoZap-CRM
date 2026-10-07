import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createPersonAction } from "@/lib/actions";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { PERSON_FUNNEL_ORDER, PERSON_STATUS_LABELS } from "@/lib/labels";

export default async function NewPersonPage() {
  await auth();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Новый частник" description="Обычный человек, не компания" />
      <Card>
        <form action={createPersonAction} className="grid gap-3">
          <Input name="name" label="Имя" required placeholder="Иван Иванов" />
          <Input name="phone" label="Телефон" type="tel" placeholder="+7 …" />
          <Input name="city" label="Город" placeholder="Москва" />
          <Select name="status" label="Этап" defaultValue="NEW">
            {PERSON_FUNNEL_ORDER.map((k) => (
              <option key={k} value={k}>
                {PERSON_STATUS_LABELS[k]}
              </option>
            ))}
          </Select>
          <ResponsibleSelect />
          <Textarea name="comment" label="Комментарий" rows={2} placeholder="По желанию" />
          <Button type="submit">Сохранить</Button>
        </form>
      </Card>
    </div>
  );
}
