import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateDealAction } from "@/lib/actions";
import { companiesForSelect, contactsForSelect, usersForSelect } from "@/lib/list-query";
import { DEAL_STAGE_LABELS } from "@/lib/labels";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) notFound();
  const [companies, contacts, users] = await Promise.all([
    companiesForSelect(),
    contactsForSelect(),
    usersForSelect(),
  ]);
  const action = updateDealAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${deal.title}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="title" label="Название" required defaultValue={deal.title} className="md:col-span-2" />
          <Select name="companyId" label="Компания" defaultValue={deal.companyId || ""}>
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select name="contactId" label="Контакт" defaultValue={deal.contactId || ""}>
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName || ""}</option>
            ))}
          </Select>
          <Select name="stage" label="Этап" defaultValue={deal.stage}>
            {Object.entries(DEAL_STAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Input name="amount" label="Сумма" type="number" step="0.01" defaultValue={deal.amount ?? ""} />
          <Input name="source" label="Источник" defaultValue={deal.source || ""} />
          <Input name="nextStep" label="Следующий шаг" defaultValue={deal.nextStep || ""} />
          <Select name="responsibleId" label="Ответственный" defaultValue={deal.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Textarea name="comment" label="Комментарий" defaultValue={deal.comment || ""} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
