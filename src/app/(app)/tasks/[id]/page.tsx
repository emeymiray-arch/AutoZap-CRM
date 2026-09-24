import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, formatDateTime } from "@/components/layout/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { EntityActions } from "@/components/crm/EntityActions";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { AuditPanel } from "@/components/crm/AuditPanel";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { canHardDelete } from "@/lib/permissions";
import { updateTaskAction } from "@/lib/actions";
import { usersForSelect } from "@/lib/list-query";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      responsible: true,
      creator: true,
      company: true,
      contact: true,
      lead: true,
      deal: true,
      partner: true,
    },
  });
  if (!task) notFound();
  const users = await usersForSelect();
  const action = updateTaskAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title={task.title}
        description={`ID: ${task.id}`}
        actions={
          <EntityActions
            entity="task"
            id={task.id}
            archived={task.archivedAt}
            canDelete={canHardDelete(session.user.role)}
            editHref={`/tasks/${id}/edit`}
            restoreTo={`/tasks/${id}`}
          />
        }
      />
      <div className="mb-4 flex gap-2">
        <Badge status={task.status}>{TASK_STATUS_LABELS[task.status] || task.status}</Badge>
        <Badge>{TASK_PRIORITY_LABELS[task.priority] || task.priority}</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Задача" className="lg:col-span-2">
          <form action={action} className="grid gap-3 md:grid-cols-2">
            <Input name="title" label="Название" required defaultValue={task.title} className="md:col-span-2" />
            <Textarea
              name="description"
              label="Описание"
              defaultValue={task.description || ""}
              className="md:col-span-2"
            />
            <Select name="responsibleId" label="Ответственный" defaultValue={task.responsibleId || ""}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
            <Input
              name="deadline"
              label="Дедлайн"
              type="datetime-local"
              defaultValue={
                task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ""
              }
            />
            <Select name="priority" label="Приоритет" defaultValue={task.priority}>
              {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Select name="status" label="Статус" defaultValue={task.status}>
              {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <input type="hidden" name="companyId" value={task.companyId || ""} />
            <input type="hidden" name="contactId" value={task.contactId || ""} />
            <input type="hidden" name="leadId" value={task.leadId || ""} />
            <input type="hidden" name="dealId" value={task.dealId || ""} />
            <input type="hidden" name="partnerId" value={task.partnerId || ""} />
            <div className="md:col-span-2 text-sm text-slate-600">
              Создатель: {task.creator?.name || "—"} · Компания: {task.company?.name || "—"} · Лид:{" "}
              {task.lead?.title || "—"} · Сделка: {task.deal?.title || "—"} · Партнёр:{" "}
              {task.partner?.name || "—"} · Создана: {formatDateTime(task.createdAt)}
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="sm">
                Сохранить
              </Button>
            </div>
          </form>
        </Card>
        <Card title="Активности">
          <ActivityFeed where={{ taskId: task.id, companyId: task.companyId }} redirectTo={`/tasks/${id}`} />
        </Card>
      </div>
      <div className="mt-4">
        <Card title="Аудит">
          <AuditPanel entityType="task" entityId={id} />
        </Card>
      </div>
    </div>
  );
}
