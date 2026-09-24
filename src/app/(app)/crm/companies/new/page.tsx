import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createCompanyAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";
import Link from "next/link";

export default async function NewCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicateOf?: string; name?: string }>;
}) {
  await auth();
  const sp = await searchParams;
  const users = await usersForSelect();
  const dupIds = sp.duplicateOf?.split(",").filter(Boolean) || [];
  const dups =
    dupIds.length > 0
      ? await prisma.company.findMany({ where: { id: { in: dupIds } } })
      : [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новая компания" />
      {dups.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <div className="font-semibold text-amber-900">Возможно, объект уже существует</div>
          <ul className="mt-2 space-y-1">
            {dups.map((d) => (
              <li key={d.id}>
                <Link href={`/crm/companies/${d.id}`} className="underline">
                  Открыть: {d.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-amber-800">
            Можно открыть существующий или создать новый (кнопка ниже с принудительным созданием).
          </p>
        </div>
      )}
      <Card>
        <form action={createCompanyAction} className="grid gap-3 md:grid-cols-2">
          {dups.length > 0 && <input type="hidden" name="forceCreate" value="1" />}
          <Input
            name="name"
            label="Название"
            required
            className="md:col-span-2"
            defaultValue={sp.name || ""}
          />
          <Input name="legalForm" label="Юридическая форма" />
          <Input name="inn" label="ИНН" />
          <Input name="city" label="Город" />
          <Input name="region" label="Регион" />
          <Input name="address" label="Адрес" className="md:col-span-2" />
          <Input name="phone" label="Телефон" />
          <Input name="email" label="Email" type="email" />
          <Input name="website" label="Сайт" />
          <Input name="companyType" label="Тип компании" />
          <Input name="skuCount" label="Кол-во SKU" type="number" />
          <Input name="categories" label="Категории" />
          <Select name="responsibleId" label="Ответственный">
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Input name="nextContactAt" label="Следующий контакт" type="datetime-local" />
          <Textarea name="notes" label="Заметки" className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">
              {dups.length > 0 ? "Создать новый всё равно" : "Создать компанию"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
