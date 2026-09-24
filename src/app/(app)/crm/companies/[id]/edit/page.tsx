import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateCompanyAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();
  const users = await usersForSelect();
  const action = updateCompanyAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${company.name}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="name" label="Название" required defaultValue={company.name} className="md:col-span-2" />
          <Input name="legalForm" label="Правовая форма" defaultValue={company.legalForm || ""} />
          <Input name="inn" label="ИНН" defaultValue={company.inn || ""} />
          <Input name="city" label="Город" defaultValue={company.city || ""} />
          <Input name="region" label="Регион" defaultValue={company.region || ""} />
          <Input name="address" label="Адрес" defaultValue={company.address || ""} className="md:col-span-2" />
          <Input name="phone" label="Телефон" defaultValue={company.phone || ""} />
          <Input name="email" label="Email" defaultValue={company.email || ""} />
          <Input name="website" label="Сайт" defaultValue={company.website || ""} />
          <Input name="companyType" label="Тип компании" defaultValue={company.companyType || ""} />
          <Input name="skuCount" label="Кол-во SKU" type="number" defaultValue={company.skuCount ?? ""} />
          <Input name="categories" label="Категории" defaultValue={company.categories || ""} />
          <Select name="status" label="Статус" defaultValue={company.status}>
            <option value="ACTIVE">Активна</option>
            <option value="INACTIVE">Неактивна</option>
          </Select>
          <Select name="responsibleId" label="Ответственный" defaultValue={company.responsibleId || ""}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Textarea name="notes" label="Заметки" defaultValue={company.notes || ""} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
