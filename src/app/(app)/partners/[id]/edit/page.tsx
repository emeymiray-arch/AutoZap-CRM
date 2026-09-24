import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updatePartnerAction } from "@/lib/actions";
import { companiesForSelect, usersForSelect } from "@/lib/list-query";
import { PARTNER_STATUS_LABELS } from "@/lib/labels";
import { MultiCityField, RegionSelect } from "@/components/crm/GeoFields";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!partner) notFound();
  const [companies, users] = await Promise.all([companiesForSelect(), usersForSelect()]);
  const action = updatePartnerAction.bind(null, id);
  const company = partner.company;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${partner.name}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required defaultValue={partner.name} className="md:col-span-2" />
          <Select name="companyId" label="Компания" defaultValue={partner.companyId || ""}>
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
          <Select name="status" label="Статус" defaultValue={partner.status}>
            {Object.entries(PARTNER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <RegionSelect defaultValue={partner.region || company?.region} />
          <MultiCityField
            name="warehouseCities"
            label="Склады — города"
            defaultValue={company?.warehouseCities}
          />
          <MultiCityField
            name="productionCities"
            label="Производство — города"
            defaultValue={company?.productionCities}
          />
          <MultiCityField
            name="storeCities"
            label="Магазины — города"
            defaultValue={company?.storeCities}
          />
          <Textarea name="comment" label="Комментарий" defaultValue={partner.comment || ""} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
