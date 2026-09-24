import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createDealAction } from "@/lib/actions";
import { contactsForSelect } from "@/lib/list-query";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { CompanyField } from "@/components/crm/CompanyField";
import { MultiCityField, RegionSelect } from "@/components/crm/GeoFields";
import { DEAL_STAGE_LABELS } from "@/lib/labels";

export default async function NewDealPage() {
  await auth();
  const contacts = await contactsForSelect();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новая сделка" />
      <Card>
        <form action={createDealAction} className="grid gap-3 md:grid-cols-2">
          <Input name="title" label="Название" required className="md:col-span-2" />
          <CompanyField hint="Если пусто — компания создастся по названию сделки" />
          <RegionSelect />
          <Select name="contactId" label="Контакт">
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ""}
              </option>
            ))}
          </Select>
          <Select name="stage" label="Этап" defaultValue="NEW">
            {Object.entries(DEAL_STAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Input name="amount" label="Сумма" type="number" step="0.01" />
          <Input name="source" label="Источник" />
          <Input name="nextStep" label="Следующий шаг" />
          <Input name="deadline" label="Дедлайн" type="datetime-local" />
          <ResponsibleSelect />
          <MultiCityField name="warehouseCities" label="Склады" />
          <MultiCityField name="productionCities" label="Производство" />
          <MultiCityField name="storeCities" label="Магазины" />
          <Textarea name="comment" label="Комментарий" className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Создать сделку</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
