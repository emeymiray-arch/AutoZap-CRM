import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createPartnerAction } from "@/lib/actions";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { MultiCityField, RegionSelect } from "@/components/crm/GeoFields";
import { PARTNER_FUNNEL_ORDER, PARTNER_STATUS_LABELS } from "@/lib/labels";
import { contactsForSelect } from "@/lib/list-query";

export default async function NewPartnerPage() {
  await auth();
  const contacts = await contactsForSelect();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новый партнёр" description="Укажите должностное лицо — контакт партнёра" />
      <Card>
        <form action={createPartnerAction} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required className="md:col-span-2" />
          <ResponsibleSelect />
          <Select name="status" label="Этап воронки" defaultValue="NEW">
            {PARTNER_FUNNEL_ORDER.map((k) => (
              <option key={k} value={k}>
                {PARTNER_STATUS_LABELS[k]}
              </option>
            ))}
          </Select>
          <RegionSelect />
          <Input name="nextContactAt" label="Следующий контакт" type="datetime-local" />

          <div className="md:col-span-2 border-t border-slate-200 pt-3 mt-1">
            <h3 className="text-sm font-semibold text-slate-800">Должностное лицо (контакт)</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Выберите существующий контакт или заполните поля — создастся новый
            </p>
          </div>
          <Select name="contactId" label="Существующий контакт" className="md:col-span-2">
            <option value="">— новый из полей ниже —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ""}
                {c.position ? ` · ${c.position}` : ""}
              </option>
            ))}
          </Select>
          <Input name="contactFirstName" label="Имя" />
          <Input name="contactLastName" label="Фамилия" />
          <Input name="contactPosition" label="Должность" />
          <Input name="contactPhone" label="Телефон" />
          <Input name="contactEmail" label="Email" type="email" className="md:col-span-2" />

          <MultiCityField name="warehouseCities" label="Склады" />
          <MultiCityField name="productionCities" label="Производство" />
          <MultiCityField name="storeCities" label="Магазины" />
          <Textarea name="comment" label="Комментарий" className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
