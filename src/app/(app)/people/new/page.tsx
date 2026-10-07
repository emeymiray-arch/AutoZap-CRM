import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createPersonAction } from "@/lib/actions";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";

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
          <ResponsibleSelect />
          <Textarea name="comment" label="Комментарий" rows={2} placeholder="По желанию" />
          <Button type="submit">Сохранить</Button>
        </form>
      </Card>
    </div>
  );
}
