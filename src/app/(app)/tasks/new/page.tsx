import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createTaskAction } from "@/lib/actions";
import {
  companiesForSelect,
  contactsForSelect,
  partnersForSelect,
} from "@/lib/list-query";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/db";

export default async function NewTaskPage() {
  await auth();
  const [companies, contacts, partners, leads, deals] = await Promise.all([
    companiesForSelect(),
    contactsForSelect(),
    partnersForSelect(),
    prisma.lead.findMany({
      where: { archivedAt: null },
      select: { id: true, title: true },
      take: 200,
    }),
    prisma.deal.findMany({
      where: { archivedAt: null },
      select: { id: true, title: true },
      take: 200,
    }),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новая задача" />
      <Card>
        <form action={createTaskAction} className="grid gap-3 md:grid-cols-2">
          <Input name="title" label="Название" required className="md:col-span-2" />
          <Textarea name="description" label="Описание" className="md:col-span-2" />
          <ResponsibleSelect />
          <Input name="deadline" label="Дедлайн" type="datetime-local" />
          <Select name="priority" label="Приоритет" defaultValue="MEDIUM">
            {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select name="status" label="Статус" defaultValue="NEW">
            {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select name="companyId" label="Компания">
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select name="contactId" label="Контакт">
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ""}
              </option>
            ))}
          </Select>
          <Select name="leadId" label="Лид">
            <option value="">—</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </Select>
          <Select name="dealId" label="Сделка">
            <option value="">—</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </Select>
          <Select name="partnerId" label="Партнёр">
            <option value="">—</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <div className="md:col-span-2">
            <Button type="submit">Создать задачу</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
