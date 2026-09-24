import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateTaskAction } from "@/lib/actions";
import {
  companiesForSelect,
  contactsForSelect,
  partnersForSelect,
  usersForSelect,
} from "@/lib/list-query";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) notFound();
  const [companies, contacts, partners, users] = await Promise.all([
    companiesForSelect(),
    contactsForSelect(),
    partnersForSelect(),
    usersForSelect(),
  ]);
  const action = updateTaskAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${task.title}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="title" label="Название" required defaultValue={task.title} className="md:col-span-2" />
          <Textarea name="description" label="Описание" defaultValue={task.description || ""} className="md:col-span-2" />
          <Select name="priority" label="Приоритет" defaultValue={task.priority}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select name="status" label="Статус" defaultValue={task.status}>
            {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select name="responsibleId" label="Ответственный" defaultValue={task.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Select name="companyId" label="Компания" defaultValue={task.companyId || ""}>
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select name="contactId" label="Контакт" defaultValue={task.contactId || ""}>
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName || ""}</option>
            ))}
          </Select>
          <Select name="partnerId" label="Партнёр" defaultValue={task.partnerId || ""}>
            <option value="">—</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <input type="hidden" name="leadId" value={task.leadId || ""} />
          <input type="hidden" name="dealId" value={task.dealId || ""} />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
