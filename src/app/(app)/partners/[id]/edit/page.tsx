import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updatePartnerAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";
import { PARTNER_FUNNEL_ORDER, PARTNER_STATUS_LABELS } from "@/lib/labels";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { company: true, contact: true },
  });
  if (!partner) notFound();
  const users = await usersForSelect();
  const action = updatePartnerAction.bind(null, id);
  const c = partner.contact;
  const statusOptions = PARTNER_FUNNEL_ORDER.includes(partner.status as never)
    ? [...PARTNER_FUNNEL_ORDER]
    : [partner.status, ...PARTNER_FUNNEL_ORDER];

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={`Изменить: ${partner.name}`} />
      <Card>
        <form action={action} className="grid gap-3">
          {partner.contactId ? <input type="hidden" name="contactId" value={partner.contactId} /> : null}
          <Input name="name" label="Название" required defaultValue={partner.name} />
          <Input name="city" label="Город" defaultValue={partner.company?.city || partner.region || ""} />

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="mb-2 text-sm font-medium text-slate-800">Контакт</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="contactFirstName" label="Имя" defaultValue={c?.firstName || ""} />
              <Input name="contactPhone" label="Телефон" type="tel" defaultValue={c?.phone || ""} />
            </div>
          </div>

          <Select name="status" label="Этап" defaultValue={partner.status}>
            {statusOptions.map((k) => (
              <option key={k} value={k}>
                {PARTNER_STATUS_LABELS[k] || k}
              </option>
            ))}
          </Select>
          <Select name="responsibleId" label="Ответственный" defaultValue={partner.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Textarea name="comment" label="Комментарий" defaultValue={partner.comment || ""} rows={2} />
          <Button type="submit">Сохранить</Button>
        </form>
      </Card>
    </div>
  );
}
