import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createPartnerAction } from "@/lib/actions";
import { companiesForSelect } from "@/lib/list-query";
import { ResponsibleSelect } from "@/components/crm/ResponsibleSelect";
import { PARTNER_STATUS_LABELS } from "@/lib/labels";

export default async function NewPartnerPage() {
  await auth();
  const companies = await companiesForSelect();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новый партнёр" />
      <Card>
        <form action={createPartnerAction} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required className="md:col-span-2" />
          <Select name="companyId" label="Компания">
            <option value="">—</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <ResponsibleSelect />
          <Select name="status" label="Статус" defaultValue="NEW">
            {Object.entries(PARTNER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input name="region" label="Регион" />
          <Input name="nextContactAt" label="Следующий контакт" type="datetime-local" />
          <Textarea name="comment" label="Комментарий" className="md:col-span-2" />
          <div className="md:col-span-2"><Button type="submit">Создать</Button></div>
        </form>
      </Card>
    </div>
  );
}
