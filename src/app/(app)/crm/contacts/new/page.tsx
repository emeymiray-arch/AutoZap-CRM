import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createContactAction } from "@/lib/actions";
import { companiesForSelect, usersForSelect } from "@/lib/list-query";
import Link from "next/link";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicateOf?: string }>;
}) {
  await auth();
  const sp = await searchParams;
  const [companies, users] = await Promise.all([companiesForSelect(), usersForSelect()]);
  const dupIds = sp.duplicateOf?.split(",").filter(Boolean) || [];
  const dups =
    dupIds.length > 0
      ? await prisma.contact.findMany({ where: { id: { in: dupIds } } })
      : [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Новый контакт" />
      {dups.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <div className="font-semibold text-amber-900">Возможно, объект уже существует</div>
          <ul className="mt-2 space-y-1">
            {dups.map((d) => (
              <li key={d.id}>
                <Link href={`/crm/contacts/${d.id}`} className="underline">
                  Открыть: {d.firstName} {d.lastName || ""}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Card>
        <form action={createContactAction} className="grid gap-3 md:grid-cols-2">
          {dups.length > 0 && <input type="hidden" name="forceCreate" value="1" />}
          <Input name="firstName" label="Имя" required />
          <Input name="lastName" label="Фамилия" />
          <Input name="position" label="Должность" />
          <Select name="companyId" label="Компания">
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input name="phone" label="Телефон" />
          <Input name="email" label="Email" type="email" />
          <Input name="telegram" label="Telegram" />
          <Input name="whatsapp" label="WhatsApp" />
          <Select name="responsibleId" label="Ответственный" className="md:col-span-2">
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Textarea name="comment" label="Комментарий" className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">
              {dups.length > 0 ? "Создать новый всё равно" : "Создать контакт"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
