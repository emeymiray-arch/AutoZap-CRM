import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { FormSubmitButton } from "@/components/ui/FormSubmitButton";
import { RegionSelect } from "@/components/crm/GeoFields";
import { EntityActions } from "@/components/crm/EntityActions";
import { PERSON_FUNNEL_ORDER, PERSON_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";
import { updatePersonAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: { responsible: true },
  });
  if (!person) notFound();
  const users = await usersForSelect();
  const action = updatePersonAction.bind(null, id);
  const statusOptions = PERSON_FUNNEL_ORDER.includes(person.status as never)
    ? PERSON_FUNNEL_ORDER
    : ([person.status, ...PERSON_FUNNEL_ORDER] as string[]);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title={person.name}
        description="Частник — можно менять любые поля"
        actions={
          <EntityActions
            entity="person"
            id={person.id}
            archived={person.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/people/${person.id}/edit`}
            restoreTo={`/people/${person.id}`}
            hideEdit
          />
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge status={person.status}>{PERSON_STATUS_LABELS[person.status] || person.status}</Badge>
        <Button href="/people?view=funnel" size="sm" variant="secondary">
          Воронка
        </Button>
      </div>
      <Card title="Редактирование">
        <form action={action} className="grid gap-3">
          <Input name="name" label="Имя" required defaultValue={person.name} />
          <Input name="phone" label="Телефон" type="tel" defaultValue={person.phone || ""} />
          <RegionSelect name="city" label="Регион" defaultValue={person.city || ""} />
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
          <FormSubmitButton>Сохранить изменения</FormSubmitButton>
        </form>
      </Card>
    </div>
  );
}
