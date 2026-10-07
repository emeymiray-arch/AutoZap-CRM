import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updatePersonAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";
import { PERSON_FUNNEL_ORDER, PERSON_STATUS_LABELS } from "@/lib/labels";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) notFound();
  const users = await usersForSelect();
  const action = updatePersonAction.bind(null, id);
  const statusOptions = PERSON_FUNNEL_ORDER.includes(person.status as never)
    ? PERSON_FUNNEL_ORDER
    : ([person.status, ...PERSON_FUNNEL_ORDER] as string[]);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={`Изменить: ${person.name}`} />
      <Card>
        <form action={action} className="grid gap-3">
          <Input name="name" label="Имя" required defaultValue={person.name} />
          <Input name="phone" label="Телефон" type="tel" defaultValue={person.phone || ""} />
          <Input name="city" label="Город" defaultValue={person.city || ""} />
          <Select name="status" label="Этап" defaultValue={person.status}>
            {statusOptions.map((k) => (
              <option key={k} value={k}>
                {PERSON_STATUS_LABELS[k] || k}
              </option>
            ))}
          </Select>
          <Select name="responsibleId" label="Ответственный" defaultValue={person.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Textarea name="comment" label="Комментарий" rows={2} defaultValue={person.comment || ""} />
          <Button type="submit">Сохранить</Button>
        </form>
      </Card>
    </div>
  );
}
