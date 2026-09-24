import { auth } from "@/lib/auth";
import { Select } from "@/components/ui/Form";
import { usersForSelect } from "@/lib/list-query";

/** Список активных участников; по умолчанию — текущий пользователь */
export async function ResponsibleSelect({
  name = "responsibleId",
  label = "Ответственный",
  defaultValue,
  className,
}: {
  name?: string;
  label?: string;
  defaultValue?: string | null;
  className?: string;
}) {
  const session = await auth();
  const users = await usersForSelect();
  const selected = defaultValue || session?.user?.id || users[0]?.id || "";

  return (
    <Select name={name} label={label} defaultValue={selected} required className={className}>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </Select>
  );
}
