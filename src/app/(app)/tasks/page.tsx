import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { EntityCard, EntityCardGrid } from "@/components/crm/EntityCard";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { parseListParams, scopeWhere } from "@/lib/list-query";
import { canAssignTasksToOthers } from "@/lib/permissions";
import { formatDateTime } from "@/components/layout/Page";
import type { Prisma } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const sp = parseListParams(await searchParams);
  const canAssign = canAssignTasksToOthers(session.user.role);

  let responsibleId = sp.responsibleId;
  if (responsibleId === "me") responsibleId = session.user.id;

  const where: Prisma.TaskWhereInput = {
    archivedAt: null,
    ...scopeWhere(session.user),
    ...(sp.status ? { status: sp.status as never } : {}),
    ...(responsibleId ? { responsibleId } : {}),
    ...(sp.q
      ? {
          OR: [
            { title: { contains: sp.q, mode: "insensitive" as const } },
            { description: { contains: sp.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  if (sp.deadline === "overdue") {
    where.AND = [
      {
        OR: [
          { status: "OVERDUE" },
          {
            deadline: { lt: new Date() },
            status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] },
          },
        ],
      },
    ];
  } else if (sp.deadline === "today") {
    where.deadline = { gte: startOfDay(new Date()), lte: endOfDay(new Date()) };
  }

  const rows = await prisma.task.findMany({
    where,
    include: { responsible: true, creator: true },
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Задачи"
        description={
          canAssign
            ? "Себе, коллеге или всей команде"
            : "Вы можете ставить задачи себе"
        }
        actions={
          <Button href="/tasks/new" size="sm">
            + Задача
          </Button>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Button href="/tasks?responsibleId=me" variant="ghost" size="sm">
          Мои
        </Button>
        <Button href="/tasks?deadline=overdue" variant="ghost" size="sm">
          Просроченные
        </Button>
        <Button href="/tasks?deadline=today" variant="ghost" size="sm">
          На сегодня
        </Button>
        <Button href="/tasks" variant="ghost" size="sm">
          Все
        </Button>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Задач нет
        </div>
      ) : (
        <EntityCardGrid>
          {rows.map((r) => (
            <EntityCard
              key={r.id}
              href={`/tasks/${r.id}`}
              title={r.title}
              badge={{ status: r.status, label: TASK_STATUS_LABELS[r.status] || r.status }}
              lines={[
                { label: "Кому", value: r.responsible?.name },
                { label: "Кто поставил", value: r.creator?.name },
                { label: "Приоритет", value: TASK_PRIORITY_LABELS[r.priority] || r.priority },
                { label: "Дедлайн", value: formatDateTime(r.deadline) },
              ]}
            />
          ))}
        </EntityCardGrid>
      )}
    </div>
  );
}
