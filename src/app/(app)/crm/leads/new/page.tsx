import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createLeadAction } from "@/lib/actions";
import { contactsForSelect } from "@/lib/list-query";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { CompanyField } from "@/components/crm/CompanyField";
import { CitySelect, MultiCityField, RegionSelect } from "@/components/crm/GeoFields";
import { LEAD_STATUS_LABELS } from "@/lib/labels";

export default async function NewLeadPage() {
  await auth();
  const contacts = await contactsForSelect();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новый лид" />
      <Card>
        <form action={createLeadAction} className="grid gap-3 md:grid-cols-2">
          <Input name="title" label="Название" required className="md:col-span-2" />
          <CompanyField />
          <Select name="contactId" label="Контакт">
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ""}
              </option>
            ))}
          </Select>
          <Input name="phone" label="Телефон" />
          <Input name="email" label="Email" type="email" />
          <CitySelect />
          <RegionSelect />
          <MultiCityField name="warehouseCities" label="Склады" />
          <MultiCityField name="productionCities" label="Производство" />
          <MultiCityField name="storeCities" label="Магазины" />
          <Input name="source" label="Источник" />
          <Input name="website" label="Сайт" />
          <Input name="avito" label="Avito" />
          <Input name="wildberries" label="WB" />
          <Input name="ozon" label="Ozon" />
          <Input name="businessType" label="Тип бизнеса" />
          <Input name="assortment" label="Ассортимент" />
          <ResponsibleSelect />
          <Select name="status" label="Статус" defaultValue="NEW">
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Input name="nextContactAt" label="Следующий контакт" type="datetime-local" />
          <Textarea name="comment" label="Комментарий" className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Создать лид</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
