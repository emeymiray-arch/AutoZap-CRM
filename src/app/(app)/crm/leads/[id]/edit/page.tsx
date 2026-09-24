import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateLeadAction } from "@/lib/actions";
import { companiesForSelect, contactsForSelect, usersForSelect } from "@/lib/list-query";
import { LEAD_STATUS_LABELS } from "@/lib/labels";
import { CitySelect, RegionSelect } from "@/components/crm/GeoFields";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();
  const [companies, contacts, users] = await Promise.all([
    companiesForSelect(),
    contactsForSelect(),
    usersForSelect(),
  ]);

  const action = updateLeadAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${lead.title}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="title" label="Название" required defaultValue={lead.title} className="md:col-span-2" />
          <Select name="companyId" label="Компания" defaultValue={lead.companyId || ""}>
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select name="contactId" label="Контакт" defaultValue={lead.contactId || ""}>
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName || ""}</option>
            ))}
          </Select>
          <Input name="phone" label="Телефон" defaultValue={lead.phone || ""} />
          <Input name="email" label="Email" defaultValue={lead.email || ""} />
          <CitySelect defaultValue={lead.city} />
          <RegionSelect defaultValue={lead.region} />
          <Input name="source" label="Источник" defaultValue={lead.source || ""} />
          <Input name="website" label="Сайт" defaultValue={lead.website || ""} />
          <Input name="avito" label="Avito" defaultValue={lead.avito || ""} />
          <Input name="wildberries" label="WB" defaultValue={lead.wildberries || ""} />
          <Input name="ozon" label="Ozon" defaultValue={lead.ozon || ""} />
          <Input name="businessType" label="Тип бизнеса" defaultValue={lead.businessType || ""} />
          <Input name="assortment" label="Ассортимент" defaultValue={lead.assortment || ""} />
          <Select name="responsibleId" label="Ответственный" defaultValue={lead.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Select name="status" label="Статус" defaultValue={lead.status}>
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Input name="rejectReason" label="Причина отказа" defaultValue={lead.rejectReason || ""} />
          <Textarea name="comment" label="Комментарий" defaultValue={lead.comment || ""} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
