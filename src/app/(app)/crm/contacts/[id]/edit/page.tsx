import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { updateContactAction } from "@/lib/actions";
import { companiesForSelect, usersForSelect } from "@/lib/list-query";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();
  const [companies, users] = await Promise.all([companiesForSelect(), usersForSelect()]);
  const action = updateContactAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Изменить: ${contact.firstName}`} />
      <Card>
        <form action={action} className="grid gap-3 md:grid-cols-2">
          <Input name="firstName" label="Имя" required defaultValue={contact.firstName} />
          <Input name="lastName" label="Фамилия" defaultValue={contact.lastName || ""} />
          <Input name="position" label="Должность" defaultValue={contact.position || ""} />
          <Select name="companyId" label="Компания" defaultValue={contact.companyId || ""}>
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input name="phone" label="Телефон" defaultValue={contact.phone || ""} />
          <Input name="email" label="Email" defaultValue={contact.email || ""} />
          <Input name="telegram" label="Telegram" defaultValue={contact.telegram || ""} />
          <Input name="whatsapp" label="WhatsApp" defaultValue={contact.whatsapp || ""} />
          <Select name="responsibleId" label="Ответственный" defaultValue={contact.responsibleId || ""} className="md:col-span-2">
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Textarea name="comment" label="Комментарий" defaultValue={contact.comment || ""} className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
