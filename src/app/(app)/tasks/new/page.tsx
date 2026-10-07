import { auth } from "@/lib/auth";
import { PageHeader, Card } from "@/components/layout/Page";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { createTaskAction } from "@/lib/actions";
import { partnersForSelect, usersForSelect } from "@/lib/list-query";
import { canAssignTasksToOthers } from "@/lib/permissions";
import { TASK_PRIORITY_LABELS } from "@/lib/labels";
import { TaskAssigneeFields } from "@/components/crm/TaskAssigneeFields";

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user) return null;
  const canAssign = canAssignTasksToOthers(session.user.role);
  const [partners, users] = await Promise.all([partnersForSelect(), usersForSelect()]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Новая задача"
        description={
          canAssign
            ? "Себе, коллеге или всей команде"
            : "Вы можете поставить задачу себе"
        }
      />
      <Card>
        <form action={createTaskAction} className="grid gap-3">
          <Input name="title" label="Название" required placeholder="Что нужно сделать" />
          <Textarea name="description" label="Описание" rows={3} placeholder="По желанию" />
          <Input name="deadline" label="Дедлайн" type="datetime-local" />
          <Select name="priority" label="Приоритет" defaultValue="MEDIUM">
            {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>

          <TaskAssigneeFields
            canAssignOthers={canAssign}
            users={users}
            currentUserId={session.user.id}
          />

          <Select name="partnerId" label="Партнёр (необязательно)">
            <option value="">—</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Button type="submit">Поставить задачу</Button>
        </form>
      </Card>
    </div>
  );
}
