import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updatePartnerAction } from "@/lib/actions";
import { contactsForSelect, usersForSelect } from "@/lib/list-query";
import { PARTNER_FUNNEL_ORDER, PARTNER_STATUS_LABELS } from "@/lib/labels";
import { MultiCityField, RegionSelect } from "@/components/crm/GeoFields";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { company: true, contact: true },
  });
  if (!partner) notFound();
  const [users, contacts] = await Promise.all([usersForSelect(), contactsForSelect()]);
  const action = updatePartnerAction.bind(null, id);
  const company = partner.company;
  const statusOptions = PARTNER_FUNNEL_ORDER.includes(partner.status as never)
    ? [...PARTNER_FUNNEL_ORDER]
    : [partner.status, ...PARTNER_FUNNEL_ORDER];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${partner.name}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required defaultValue={partner.name} className="md:col-span-2" />
          <Select name="responsibleId" label="Ответственный" defaultValue={partner.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Select name="status" label="Этап воронки" defaultValue={partner.status}>
            {statusOptions.map((k) => (
              <option key={k} value={k}>
                {PARTNER_STATUS_LABELS[k] || k}
              </option>
            ))}
          </Select>
          <RegionSelect defaultValue={partner.region || company?.region} />

          <div className="md:col-span-2 border-t border-slate-200 pt-3 mt-1">
            <h3 className="text-sm font-semibold text-slate-800">Должностное лицо (контакт)</h3>
          </div>
          <Select name="contactId" label="Контакт" className="md:col-span-2" defaultValue={partner.contactId || ""}>
            <option value="">— новый из полей ниже —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ""}
                {c.position ? ` · ${c.position}` : ""}
              </option>
            ))}
          </Select>
          <Input name="contactFirstName" label="Имя (если новый)" />
          <Input name="contactLastName" label="Фамилия (если новый)" />
          <Input name="contactPosition" label="Должность (если новый)" />
          <Input name="contactPhone" label="Телефон (если новый)" />
          <Input name="contactEmail" label="Email (если новый)" type="email" className="md:col-span-2" />

          <MultiCityField
            name="warehouseCities"
            label="Склады"
            defaultValue={company?.warehouseCities}
          />
          <MultiCityField
            name="productionCities"
            label="Производство"
            defaultValue={company?.productionCities}
          />
          <MultiCityField name="storeCities" label="Магазины" defaultValue={company?.storeCities} />
          <Textarea name="comment" label="Комментарий" defaultValue={partner.comment || ""} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
